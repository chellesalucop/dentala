import React, { useState, useEffect } from 'react';
import { API_URL } from '../api';
import { Search, CheckCircle, XCircle, CheckSquare, X, Calendar, User, Mail, Phone, RotateCw, Info, Plus, UserPlus, Clock } from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function AdminAppointmentsPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States for Full Details
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWalkinModalOpen, setIsWalkinModalOpen] = useState(false);
  
  // Walk-in Form State (Mirrored from AppointmentFormPage)
  const [walkinData, setWalkinData] = useState({
    fullName: '',
    phone: '',
    email: '',
    medicalConditions: [],
    serviceType: '',
    customService: '',
    preferredDentist: '',
    others: '',
    appointmentDate: '',
    preferredTime: ''
  });

  const [takenSlots, setTakenSlots] = useState([]);
  const [showOthers, setShowOthers] = useState(false);
  
  // 🛡️ ERROR STATE HANDLING: Frontend Synchronize Label: Walkin-Error-State-Handling
  const [walkinErrors, setWalkinErrors] = useState({});
  
  // Load More state
  const [visibleCount, setVisibleCount] = useState(15);

  // Dentists state for reverse lookup
  const [dentists, setDentists] = useState([]);
  
  // Refresh state for live sync
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setVisibleCount(15); // Reset visible count when refreshing
    try {
      await Promise.all([fetchAppointments(), fetchDentists()]);
      showAlert('Schedule updated!', 'success');
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const showAlert = (message, type = 'info') => {
    // Create a consistent black-themed alert notification
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 bg-[#1a1a1a] text-white border border-gray-800 animate-fade-in-up`;
    
    // Add icon based on type
    const iconHtml = type === 'success' 
      ? '<CheckCircle size={16} className="text-green-400" />'
      : type === 'error' 
      ? '<XCircle size={16} className="text-red-400" />'
      : '<RotateCw size={16} className="text-[#5b9bd5]" />';
    
    alertDiv.innerHTML = 
      '<div class="flex items-center gap-2">' +
        '<span class="inline-flex items-center">' + iconHtml + '</span>' +
        '<span>' + message + '</span>' +
      '</div>';
    
    document.body.appendChild(alertDiv);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.classList.add('opacity-0', 'translate-x-full');
        setTimeout(() => {
          if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
          }
        }, 300);
      }
    }, 3000);
  };

  useEffect(() => {
    fetchAppointments();
    fetchDentists();
  }, []);

  // Standard Conditions for Checkboxes
  const conditions = [
    "Toothache", "Wisdom Tooth Pain", "Sensitive Teeth", 
    "Broken/Chipped Tooth", "Cavity", "Loose Tooth", 
    "Bleeding Gums", "Bad Breath", "Cosmetic Improvement"
  ];

  // 🛡️ SIX MONTHS FROM NOW: Used for DatePicker maxDate
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

  // 🛡️ Slot Guard for Walk-in Modal
  useEffect(() => {
    const fetchTakenSlots = async () => {
      if (!walkinData.appointmentDate) return;
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`http://127.0.0.1:8000/api/appointments/check-slots?date=${walkinData.appointmentDate}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const data = await response.json();
        const apiTaken = (data.taken_times || []).map(time => time.toUpperCase());
        setTakenSlots(apiTaken);
      } catch (err) { console.error("Slot check failed", err); }
    };
    fetchTakenSlots();
  }, [walkinData.appointmentDate]);

  const fetchDentists = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://127.0.0.1:8000/api/dentists', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDentists(data.dentists || []);
      }
    } catch (error) {
      console.error("Error fetching dentists:", error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/api/admin/appointments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error("Error fetching your appointments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
  let reason = '';
  
  // 🛡️ 1. REJECT/NO-SHOW/EXPIRED GUARD: Requires a text reason prompt
  if (newStatus === 'declined' || newStatus === 'cancelled' || newStatus === 'no-show' || newStatus === 'expired') {
    reason = window.prompt(`Please provide a reason for ${newStatus === 'no-show' ? 'No-Show' : newStatus === 'expired' ? 'expiration' : 'declining'}:`);
    if (reason === null) return; 
    if (reason.trim() === "") {
      alert("A reason is required to proceed.");
      return;
    }
  }

  // 🛡️ 2. ACCIDENTAL CLICK GUARD: Added warning for Confirm and Complete
  if (newStatus === 'confirmed') {
    const confirmAction = window.confirm("Are you sure you want to CONFIRM this appointment? This will notify the patient.");
    if (!confirmAction) return;
  }

  if (newStatus === 'completed') {
    const confirmAction = window.confirm("Mark this appointment as COMPLETED? This will move it to the clinical history.");
    if (!confirmAction) return;
  }

  const token = localStorage.getItem('auth_token');
  try {
    const response = await fetch(`${API_URL}/api/admin/appointments/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({ 
        status: newStatus,
        cancellation_reason: reason 
      })
    });

    if (response.ok) {
      setAppointments(appointments.map(app => app.id === id ? { ...app, status: newStatus, cancellation_reason: reason } : app));
      showAlert(`Appointment ${newStatus}!`, 'success');
    } else {
      showAlert("Failed to update status.", 'error');
    }
  } catch (error) {
    showAlert("Error connecting to server.", 'error');
  }
};

  const openModal = (appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const getDentistName = (email) => {
    if (!Array.isArray(dentists) || dentists.length === 0) return email;
    const found = dentists.find(d => d.email === email);
    return found ? `Dr. ${found.name}` : email;
  };

  const formatTime = (timeStr) => {
    // If time already has AM/PM, return as-is
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      return timeStr;
    }
    // If time is in 24-hour format (e.g., "15:00"), convert to 12-hour with AM/PM
    const [hours, minutes] = timeStr.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }

  // 🛡️ RE-INTEGRATED FILTER LOGIC: Required for list to display correctly
  const filteredAppointments = appointments.filter(appt => {
    const matchesTab = appt.status === activeTab || (activeTab === 'no-show' && appt.status === 'cancelled');
    const matchesSearch = appt.service_type.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          appt.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getCounts = (status) => appointments.filter(a => a.status === status).length;

  // Walkin-Print-Name-Fix: Resolves name from email for the slip
  const handlePrintReceipt = (data) => {
    // Find the actual name from the dentists array
    const dentistObj = dentists.find(d => d.email === data.preferredDentist);
    const dentistDisplayName = dentistObj ? `Dr. ${dentistObj.name}` : data.preferredDentist;

    const printWindow = window.open('', '_blank');
    const receiptContent = `
      <html>
        <head>
          <title>Walk-in Receipt - Dentala</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px dashed #eee; padding-bottom: 5px; }
            .status-badge { font-weight: bold; color: #5b9bd5; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Dentala</h1>
            <p>Appointment Confirmation Slip</p>
          </div>
          <div class="details">
            <div class="row"><strong>Patient:</strong> <span>${data.fullName}</span></div>
            <div class="row"><strong>Service:</strong> <span>${data.serviceType === 'Other' ? data.customService : data.serviceType}</span></div>
            <div class="row"><strong>Date:</strong> <span>${data.appointmentDate}</span></div>
            <div class="row"><strong>Time:</strong> <span>${data.preferredTime}</span></div>
            <div class="row"><strong>Dentist:</strong> <span>${dentistDisplayName}</span></div>
            <div class="row"><strong>Status:</strong> <span class="status-badge">Confirmed</span></div>
          </div>
          <div class="footer" style="text-align:center; margin-top:50px; font-size:12px; color:#888;">
            <p>Please present this slip at the counter upon arrival.</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(receiptContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const handleWalkinChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === "checkbox") {
      if (value === "Others (please specify)") setShowOthers(checked);
      const updated = checked 
        ? [...walkinData.medicalConditions, value]
        : walkinData.medicalConditions.filter(c => c !== value);
      setWalkinData(prev => ({ ...prev, medicalConditions: updated }));
      return;
    }

    if (name === "fullName") {
      const sanitized = value.replace(/[^A-Za-z\s.\-']/g, ''); 
      setWalkinData(prev => ({ ...prev, [name]: sanitized }));
      return;
    }

    if (name === "phone") {
      const onlyNums = value.replace(/[^0-9]/g, '');
      if (onlyNums.length <= 11) setWalkinData(prev => ({ ...prev, [name]: onlyNums }));
      return;
    }

    setWalkinData(prev => ({ ...prev, [name]: value }));
  };

  const submitWalkin = async (e) => {
    e.preventDefault();
    const errors = {};

    // 🛡️ Strict Domain Check
    const emailValue = walkinData.email.toLowerCase();
    if (!emailValue.endsWith('@gmail.com') && !emailValue.endsWith('@yahoo.com')) {
      errors.email = ["Only @gmail.com or @yahoo.com addresses are accepted."];
    }

    // 🛡️ "Other" Service Requirement Check
    if (walkinData.serviceType === 'Other' && !walkinData.customService?.trim()) {
      errors.customService = ["Please specify the dental service."];
    }

    // 🛡️ MEDICAL "OTHERS" REQUIREMENT CHECK
    // Ensures that if the checkbox is ticked, the textarea isn't empty
    if (walkinData.medicalConditions.includes("Others (please specify)") && !walkinData.others?.trim()) {
      errors.others = ["Please describe the medical condition."];
    }

    if (Object.keys(errors).length > 0) {
      setWalkinErrors(errors);
      showAlert("Please correct the highlighted errors.", 'error');
      return;
    }

    setWalkinErrors({}); // Reset errors before a new attempt
    
    const token = localStorage.getItem('auth_token');
    try {
      const response = await fetch(`${API_URL}/api/admin/appointments/walk-in`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json' // Critical for getting JSON error responses
        },
        body: JSON.stringify(walkinData)
      });

      const data = await response.json();

      if (response.status === 422) {
        // Map Laravel's validation errors to our local state
        setWalkinErrors(data.errors || {});
        showAlert("Please check the form for errors.", 'error');
        return;
      }

      if (response.ok) {
        handlePrintReceipt(walkinData);
        setIsWalkinModalOpen(false);
        
        // 🛡️ Proper state reset
        setWalkinData({
          fullName: '',
          phone: '',
          email: '',
          medicalConditions: [],
          serviceType: '',
          customService: '',
          preferredTime: '',
          appointmentDate: '',
          preferredDentist: '',
          others: ''
        });
        
        fetchAppointments();
        showAlert("Walk-in registered successfully!", 'success');
      } else {
        showAlert(data.message || "An unexpected error occurred.", 'error');
      }
    } catch (error) { 
      console.error(error);
    }
  };

  // 🛡️ Admin-Patient-Report-v1: Unified Clinical Print Logic
  const handlePrintPatientInfo = (appt) => {
    const dentistName = getDentistName(appt.preferred_dentist);
    const printWindow = window.open('', '_blank');
    
    // Format Medical Conditions safely (Handles Array or JSON String)
    let conditionsText = 'None listed';
    const medicalConditions = appt?.medical_conditions;
    if (Array.isArray(medicalConditions)) {
      conditionsText = medicalConditions.length > 0 ? medicalConditions.join(', ') : 'None listed';
    } else if (typeof medicalConditions === 'string' && medicalConditions.trim() !== '') {
      try {
        const parsed = JSON.parse(medicalConditions);
        conditionsText = Array.isArray(parsed) && parsed.length > 0 ? parsed.join(', ') : 'None listed';
      } catch (e) { conditionsText = medicalConditions; }
    }
    
    let htmlContent = '<html><head><title>Patient Record - ' + appt.full_name + '</title>';
    htmlContent += '<style>body { font-family: "Segoe UI", sans-serif; padding: 50px; color: #1a1a1a; line-height: 1.6; }';
    htmlContent += '.header { text-align: center; border-bottom: 3px solid #5b9bd5; padding-bottom: 20px; margin-bottom: 30px; }';
    htmlContent += '.section-title { background: #f8fafc; padding: 8px 15px; font-weight: 800; text-transform: uppercase; font-size: 11px; border-left: 4px solid #5b9bd5; margin-top: 25px; }';
    htmlContent += '.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px; }';
    htmlContent += '.label { font-weight: bold; color: #64748b; font-size: 10px; text-transform: uppercase; }';
    htmlContent += '.value { font-size: 14px; color: #0f172a; margin-top: 2px; }</style></head><body>';
    htmlContent += '<div class="header"><h1>DENTALA</h1><p>CLINICAL PATIENT RECORD</p></div>';
    htmlContent += '<div class="section-title">Patient Identity</div><div class="grid">';
    htmlContent += '<div><div class="label">Full Name</div><div class="value">' + appt.full_name + '</div></div>';
    htmlContent += '<div><div class="label">Contact</div><div class="value">' + appt.phone + '</div></div>';
    htmlContent += '<div><div class="label">Email Address</div><div class="value">' + appt.email + '</div></div></div>';
    htmlContent += '<div class="section-title">Appointment Details</div><div class="grid">';
    htmlContent += '<div><div class="label">Service</div><div class="value">' + (appt.service_type === 'Other' ? appt.custom_service : appt.service_type) + '</div></div>';
    htmlContent += '<div><div class="label">Schedule</div><div class="value">' + new Date(appt.appointment_date).toLocaleDateString() + ' at ' + formatTime(appt.preferred_time) + '</div></div>';
    htmlContent += '<div><div class="label">Dentist</div><div class="value">' + dentistName + '</div></div></div>';
    htmlContent += '<div class="section-title">Medical History</div>';
    htmlContent += '<div style="margin-top:15px;"><div class="label">Conditions</div><div class="value">' + conditionsText + '</div></div>';
    htmlContent += '<div style="margin-top:15px;"><div class="label">Clinical Notes</div><div class="value">' + (appt.others || 'None') + '</div></div>';
    if (appt.cancellation_reason) {
      htmlContent += '<div class="section-title" style="border-left-color: #ef4444;">Audit Trail</div>';
      htmlContent += '<div style="margin-top:15px;"><div class="label">Remarks</div><div class="value">' + appt.cancellation_reason + '</div></div>';
    }
    htmlContent += '</body></html>';

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => { printWindow.print(); printWindow.close(); };
  };

  // 🛡️ RE-INTEGRATED FILTER LOGIC: Required for the list to display correctly
  const filteredAppointmentsList = appointments.filter(appt => {
    const matchesTab = appt.status === activeTab || (activeTab === 'no-show' && appt.status === 'cancelled');
    const matchesSearch = appt.service_type.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          appt.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="text-black text-left">
      <style>{`
        .react-datepicker-wrapper { display: block !important; width: 100% !important; }
        .react-datepicker__input-container { display: block !important; width: 100% !important; }  
        /* THE GHOST INDICATOR KILLER */
        .react-datepicker__day--keyboard-selected {
          background-color: transparent !important;
          color: #111827 !important;
          border: none !important;
          outline: none !important;
        }
      
        .react-datepicker__day--selected {
          background-color: #5b9bd5 !important;
          color: white !important;
          border-radius: 8px !important;
        }
      
        .react-datepicker__day--disabled {
          color: #d1d5db !important;
          background-color: #f9fafb !important;
          cursor: not-allowed !important;
        }

        .react-datepicker__day:hover:not(.react-datepicker__day--disabled) {
          background-color: #eff6ff !important;
          color: #5b9bd5 !important;
        }

        /* 🛡️ Force Pointer Cursor & Hide Caret */
        .react-datepicker__input-container input {
          caret-color: transparent !important;
          cursor: pointer !important;
        }
      `}</style>
      <div className="mb-8">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Schedule</h1>
            <p className="text-gray-600 font-medium">Manage appointments assigned specifically to you</p>
          </div>
          <div className="flex gap-3">
            {/* Walk-in Button - Matches Refresh Aesthetic */}
            <button
              onClick={() => setIsWalkinModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg font-bold transition-colors border-none cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Walk-in
            </button>
            <button onClick={fetchAppointments} className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg font-bold border-none cursor-pointer">
              <RotateCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Search Row */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            maxLength={255}
            placeholder="Search your patients or services..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5b9bd5]"
          />
        </div>
      </div>

      {/* 🛡️ TABS: Updated to include distinct No-Show category */}
      <div className="flex flex-wrap bg-gray-200 p-1.5 rounded-full w-max mb-8">
        {['pending', 'confirmed', 'completed', 'cancelled', 'declined', 'no-show', 'expired'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ border: 'none' }}
            className={`px-6 py-2.5 rounded-full font-bold text-sm capitalize transition-all m-0 outline-none cursor-pointer ${
              activeTab === tab 
                ? '!bg-white !text-black shadow-sm' 
                : '!bg-transparent !text-gray-500 hover:!text-gray-900'
            }`}
          >
            {/* 🛡️ Transform "no-show" to "No-Show" for the UI label */}
            {tab === 'no-show' ? 'No-Show' : tab} ({getCounts(tab)})
          </button>
        ))}
      </div>

      {/* 🛡️ RE-SORTED AND SLICED LIST */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-gray-200 text-gray-500 font-medium">
          No {activeTab} appointments found in your schedule.
        </div>
      ) : (
        <div className="space-y-8">
          {/* Use .slice(0, visibleCount) to limit to 15 items initially */}
          {[...filteredAppointments]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, visibleCount)
            .map((appt) => (
              <div key={appt.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-md flex flex-col md:flex-row justify-between items-center gap-6 animate-fade-in-up">
                
                  <div className="flex-1 w-full text-left">
                    <div className="mb-2">
                      <h3 className="text-xl font-bold truncate block max-w-[400px]">
                        {appt.service_type === 'Other' 
                          ? `Other (${appt.custom_service || appt.customService || 'No details provided'})` 
                          : appt.service_type}
                      </h3>
                    </div>
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col md:flex-row md:items-center gap-4 text-sm font-medium text-gray-500">
                        <div className="flex items-center gap-2">
                          <img src="/images/calendar.png" className="w-4 h-4 opacity-60" alt="" />
                          {new Date(appt.appointment_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-2">
                          <img src="/images/clock.png" className="w-4 h-4 opacity-60" alt="" />
                          {formatTime(appt.preferred_time)}
                        </div>
                      </div>
                    </div>
                  {/* 🛡️ THE FIX: Truncate long patient names to prevent card expansion */}
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mt-2 min-w-0">
                    <span className="text-black font-bold truncate block w-full max-w-[350px]">
                      Patient: {appt.full_name}
                    </span>
                  </div>
                </div>

                {/* Actions Section */}
                <div className="flex flex-col items-end gap-4 w-full md:w-auto">
                  <div className="flex items-center gap-3">
                    {/* 🛡️ NEW: Walk-in Indicator Badge */}
                    {appt.booked_by_admin && (
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-purple-200">
                        Walk-in
                      </span>
                    )}
                    
                    {/* 🛡️ THE FIX: Dynamic Audit Metadata for Admins */}
                    <div className="flex flex-col items-end gap-1 mb-2">
                      {/* Always show the original booking time */}
                      <div className="text-[12px] text-gray-500 font-bold italic">
                        Booked on: {new Date(appt.created_at).toLocaleString('en-US', { 
                          month: 'short', day: 'numeric', year: 'numeric', 
                          hour: 'numeric', minute: '2-digit', hour12: true 
                        })}
                      </div>
                      
                      {/* Show the status transition time (Confirmed on, Declined on, etc.) */}
                      {['confirmed', 'completed', 'cancelled', 'declined', 'no-show', 'expired'].includes(appt.status) && (
                        <div className={`text-[11px] font-bold italic ${
                          appt.status === 'confirmed' ? 'text-[#5b9bd5]' : 
                          appt.status === 'completed' ? 'text-green-600' : 
                          appt.status === 'expired' ? 'text-black' : 'text-red-400'
                        }`}>
                          {appt.status === 'confirmed' ? 'Confirmed on: ' : 
                           appt.status === 'completed' ? 'Completed on: ' : 
                           appt.status === 'cancelled' ? 'Cancelled on: ' : 
                           appt.status === 'declined' ? 'Declined on: ' : 
                           appt.status === 'no-show' ? 'No-Show on: ' : 'Expired on: '}
                          
                          {appt.updated_at ? (
                            new Date(appt.updated_at).toLocaleString('en-US', { 
                              month: 'short', day: 'numeric', year: 'numeric', 
                              hour: 'numeric', minute: '2-digit', hour12: true 
                            })
                          ) : (
                            'Syncing...'
                          )}
                        </div>
                      )}
                    </div>
                    
                    <span className={`hidden md:inline-block px-4 py-1.5 rounded-full text-sm font-black capitalize ${
                      appt.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                      appt.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                      appt.status === 'completed' ? 'bg-green-100 text-green-700' :
                      appt.status === 'expired' ? 'bg-black text-white' : // 🎯 THE BLACKOUT
                      ['declined', 'cancelled', 'no-show'].includes(appt.status) ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {appt.status === 'no-show' ? 'No-Show' : appt.status}
                    </span>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto">
                    <button 
                      onClick={() => openModal(appt)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-white border border-[#5b9bd5] text-[#5b9bd5] font-bold rounded-lg hover:bg-blue-50 transition-all duration-200 cursor-pointer"
                    >
                      <Info size={18} />
                      View Details
                    </button>
                    {activeTab === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(appt.id, 'confirmed')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold rounded-lg transition-all duration-200 cursor-pointer">
                          <CheckCircle size={18} /> Confirm
                        </button>
                        <button onClick={() => updateStatus(appt.id, 'declined')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-[#1a1a1a] hover:bg-[#333333] text-white border border-transparent font-bold rounded-lg transition-all duration-200 cursor-pointer">
                          <XCircle size={18} /> Decline
                        </button>
                      </>
                    )}

                    {activeTab === 'confirmed' && (
                      <>
                        <button onClick={() => updateStatus(appt.id, 'completed')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-[#0f172a] hover:bg-[#333333] text-white font-bold rounded-lg transition-all duration-200 cursor-pointer">
                          <CheckSquare size={18} /> Complete
                        </button>
                        {/* 🛡️ THE FIX: Set status to 'no-show' for missed confirmed appointments */}
                        <button onClick={() => updateStatus(appt.id, 'no-show')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-[#1a1a1a] hover:bg-[#333333] text-white border border-transparent font-bold rounded-lg transition-all duration-200 cursor-pointer">
                          <XCircle size={18} /> No-Show
                        </button>
                      </>
                    )}
                  </div>
                </div>

              </div>
            ))}
          
          {/* ➕ "View More" Button Logic */}
          {filteredAppointments.length > visibleCount && (
            <div className="flex justify-center mt-12">
              <button 
                onClick={() => setVisibleCount(prev => prev + 15)}
                className="flex items-center gap-2 px-8 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 hover:border-[#5b9bd5] hover:text-[#5b9bd5] transition-all cursor-pointer shadow-sm"
              >
                <Plus size={18} />
                View More ({filteredAppointments.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* MODAL: Patient Information (Admin View) */}
      {isModalOpen && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900">Patient Information</h2>
                {/* 🛡️ THE PRINT BUTTON: Positioned in the header for easy access */}
                <button 
                  onClick={() => handlePrintPatientInfo(selectedAppointment)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-xs font-bold transition-all border-none cursor-pointer"
                >
                  <RotateCw size={14} className="text-[#5b9bd5]" />
                  Print Record
                </button>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="bg-black hover:bg-gray-800 text-white p-1.5 rounded-full transition-colors flex items-center justify-center border-none cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* 1. Patient Primary Identity Card */}
              <section className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    {selectedAppointment.profile_photo_path ? (
                      <img 
                        src={`${API_URL}/storage/${selectedAppointment.profile_photo_path}`} 
                        alt={selectedAppointment.full_name} 
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <User size={40} className="text-gray-300" />
                    )}
                  </div>
                  <div className="text-center md:text-left">
                    <h4 className="text-2xl font-bold text-black mb-2 break-all line-clamp-2">
                      {selectedAppointment.full_name}
                    </h4>
                    <div className="space-y-1">
                      <p className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-600 break-all">
                        <Mail size={16} className="text-[#5b9bd5] shrink-0" /> 
                        <span>{selectedAppointment.email}</span>
                      </p>
                      <p className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-600">
                        <Phone size={16} className="text-[#5b9bd5]" /> {selectedAppointment.phone}
                      </p>
                      <p className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-500">
                        <Mail size={16} className="text-gray-400" /> Booked by: {selectedAppointment.user_email || selectedAppointment.email}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. Service Requested Section */}
              <section>
                <h4 className="text-xs uppercase text-black font-bold mb-3 tracking-[0.2em]">Service Requested</h4>
                <p className="text-lg font-bold text-gray-900 break-words whitespace-pre-wrap">
                  {selectedAppointment.service_type === 'Other' 
                    ? `Other (${selectedAppointment.custom_service || selectedAppointment.customService || 'No details'})` 
                    : selectedAppointment.service_type}
                </p>
              </section>

              {/* 3. Clinical & Medical Section */}
              <section className="pt-8 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* 🛡️ Walkin-Join-Crash-Fix: Safely handles both Array and String formats */}
                  <div>
                    <h4 className="text-xs uppercase text-black font-bold mb-3 tracking-[0.2em]">Medical Conditions</h4>
                    <p className="text-sm text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
                      {(() => {
                        const medicalConditions = selectedAppointment?.medical_conditions;
                        
                        // 1. If it's already an array, join it
                        if (Array.isArray(medicalConditions)) {
                          return medicalConditions.length > 0 ? medicalConditions.join(', ') : 'No medical conditions listed.';
                        }
                        
                        // 2. If it's a JSON string from the DB, parse and join it
                        if (typeof medicalConditions === 'string' && medicalConditions.trim() !== '') {
                          try {
                            const parsed = JSON.parse(medicalConditions);
                            return Array.isArray(parsed) && parsed.length > 0 
                              ? parsed.join(', ') 
                              : 'No medical conditions listed.';
                          } catch (e) {
                            // Fallback if it's a plain non-JSON string
                            return medicalConditions;
                          }
                        }
                        
                        return 'No medical conditions listed.';
                      })()}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs uppercase text-black font-bold mb-3 tracking-[0.2em]">Clinical Notes</h4>
                    <p className="text-sm text-gray-600 italic break-all whitespace-pre-wrap">
                      {selectedAppointment.others || 'None provided.'}
                    </p>
                  </div>
                </div>
              </section>

              {/* 4. Appointment Details Grid */}
              <section>
                <h4 className="text-xs uppercase text-black font-bold mb-3 tracking-[0.2em]">Appointment Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h5 className="text-sm font-bold text-gray-700 mb-2">Date & Time</h5>
                    <p className="text-black text-base leading-tight">
                      {new Date(selectedAppointment.appointment_date).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                    <p className="text-black text-base">
                      {selectedAppointment.preferred_time}
                    </p>
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-gray-700 mb-2">Assigned Dentist</h5>
                    <p className="text-base text-black">
                      {getDentistName(selectedAppointment.preferred_dentist)}
                    </p>
                  </div>
                </div>
              </section>

              {/* 🛡️ ADMIN AUDIT: Display reason for any unsuccessful appointment with dedicated headers */}
              {['cancelled', 'declined', 'no-show'].includes(selectedAppointment.status) && (
                <section className="pt-6 border-t border-red-100 bg-red-50 p-4 rounded-xl mt-4">
                  <div className="flex items-center gap-2 mb-2 text-red-600 font-bold uppercase text-[10px] tracking-widest">
                    <XCircle size={14} /> 
                    {/* 🛡️ THE FIX: Each status now has its own dedicated header string */}
                    {selectedAppointment.status === 'cancelled' && "Reason for Cancellation"}
                    {selectedAppointment.status === 'declined' && "Reason for Decline"}
                    {selectedAppointment.status === 'no-show' && "Reason for No-Show"}
                  </div>
                  <p className="text-gray-800 italic text-sm pl-6 border-l-2 border-red-200 break-all whitespace-pre-wrap">
                    "{selectedAppointment.cancellation_reason || 'No specific reason provided.'}"
                  </p>
                </section>
              )}
              {/* 🎯 MODAL AUDIT: Monochrome Expired Styling */}
              {selectedAppointment.status === 'expired' && (
                <section className="pt-6 border-t border-gray-900 bg-gray-50 p-4 rounded-xl mt-4">
                  <div className="flex items-center gap-2 mb-2 text-black font-black uppercase text-[10px] tracking-widest">
                        <Clock size={14} /> 
                        Reason for Expiration
                  </div>
                  <p className="text-gray-800 italic text-sm pl-6 border-l-2 border-black break-all whitespace-pre-wrap">
                    "{selectedAppointment.cancellation_reason || 'Automatically expired due to inactivity.'}"
                  </p>
                </section>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- VERY WIDE WALK-IN MODAL (Full Booking Logic Integrated) --- */}
      {isWalkinModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <form onSubmit={submitWalkin} className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            
            <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
                  <UserPlus className="text-[#5b9bd5]" /> Walk-in Registration
                </h2>
                <p className="text-sm text-gray-500">Book an appointment manually for a patient in the clinic</p>
              </div>
              <button type="button" onClick={() => setIsWalkinModalOpen(false)} className="bg-black hover:bg-gray-800 text-white p-2 rounded-full cursor-pointer border-none">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto bg-gray-50/30">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. Personal Information */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#5b9bd5] mb-6">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 uppercase ml-1">Full Name</label>
                        <input 
                          type="text" 
                          name="fullName" 
                          maxLength={255}
                          value={walkinData.fullName} 
                          onChange={handleWalkinChange} 
                          required 
                          className={`w-full px-4 py-3 rounded-xl border bg-white text-black focus:ring-2 focus:ring-[#5b9bd5] outline-none transition-all ${walkinErrors.fullName ? 'border-red-500' : 'border-gray-300'}`} 
                          placeholder="John Doe" 
                        />
                        {walkinErrors.fullName && <p className="text-[10px] text-red-500 font-bold ml-1">{walkinErrors.fullName[0]}</p>}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 uppercase ml-1">Phone Number</label>
                        <input 
                          type="text" 
                          name="phone" 
                          value={walkinData.phone} 
                          onChange={handleWalkinChange} 
                          required 
                          className={`w-full px-4 py-3 rounded-xl border bg-white text-black focus:ring-2 focus:ring-[#5b9bd5] outline-none transition-all ${walkinErrors.phone ? 'border-red-500' : 'border-gray-300'}`} 
                          placeholder="09XXXXXXXXX" 
                        />
                        {walkinErrors.phone && <p className="text-[10px] text-red-500 font-bold ml-1">{walkinErrors.phone[0]}</p>}
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-gray-700 uppercase ml-1">Email Address</label>
                        <input 
                          type="email" 
                          name="email" 
                          maxLength={255}
                          value={walkinData.email} 
                          onChange={handleWalkinChange} 
                          required 
                          className={`w-full px-4 py-3 rounded-xl border bg-white text-black focus:ring-2 focus:ring-[#5b9bd5] outline-none transition-all ${walkinErrors.email ? 'border-red-500' : 'border-gray-300'}`} 
                          placeholder="patient@email.com" 
                        />
                        {walkinErrors.email && <p className="text-[10px] text-red-500 font-bold ml-1">{walkinErrors.email[0]}</p>}
                      </div>
                    </div>
                  </div>

                  {/* 2. Medical Conditions (Grid from Patient Side) */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#5b9bd5] mb-4">Medical Conditions</h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 text-black">
                      {conditions.map(cond => (
                        <label key={cond} className="flex items-center gap-2 text-sm cursor-pointer hover:text-[#5b9bd5] transition-colors">
                          <input 
                            type="checkbox" 
                            name="medicalConditions" 
                            maxLength={255}
                            value={cond} 
                            checked={walkinData.medicalConditions.includes(cond)} 
                            onChange={handleWalkinChange} 
                            className="appearance-none w-4 h-4 rounded border-2 border-gray-300 bg-white checked:bg-[#5b9bd5] checked:border-[#5b9bd5] focus:ring-[#5b9bd5] focus:ring-offset-0 transition-all cursor-pointer relative"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='m13.854 3.646-7.5 7.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6 10.293l7.146-7.147a.5.5 0 0 1 .708.708z'/%3e%3c/svg%3e")`,
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat',
                              backgroundSize: '0.75rem'
                            }}
                          />
                          {cond}
                        </label>
                      ))}
                    </div>
                    <label className="flex items-center gap-2 text-sm font-bold border-t pt-4 cursor-pointer text-black">
                      <input 
                        type="checkbox" 
                        name="medicalConditions" 
                        maxLength={255}
                        value="Others (please specify)" 
                        checked={walkinData.medicalConditions.includes("Others (please specify)")} 
                        onChange={handleWalkinChange} 
                        className="appearance-none w-4 h-4 rounded border-2 border-gray-300 bg-white checked:bg-[#5b9bd5] checked:border-[#5b9bd5] focus:ring-[#5b9bd5] focus:ring-offset-0 cursor-pointer relative"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='m13.854 3.646-7.5 7.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6 10.293l7.146-7.147a.5.5 0 0 1 .708.708z'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '0.75rem'
                        }}
                      />
                      Others (please specify)
                    </label>

                    {showOthers && (
                      <div className="mt-3">
                        <textarea 
                          name="others" 
                          value={walkinData.others} 
                          onChange={handleWalkinChange} 
                          required={true} // 🛡️ Explicitly required when visible
                          className={`w-full p-3 rounded-xl border bg-white text-black focus:ring-2 focus:ring-[#5b9bd5] outline-none transition-all ${
                            walkinErrors.others ? 'border-red-500' : 'border-gray-300'
                          }`} 
                          rows="2" 
                          placeholder="Please specify medical condition"
                        />
                        {walkinErrors.others && (
                          <p className="text-[10px] text-red-500 font-bold ml-1 mt-1">{walkinErrors.others[0]}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Appointment Details (Sidebar) */}
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#5b9bd5] mb-6">Service & Schedule</h3>
                    
                    <div className="space-y-4">
                      {/* 🛡️ SERVICE SELECTION SECTION */}
                      <div className="space-y-1 text-left">
                        <label className="text-xs font-bold text-gray-700 uppercase ml-1">Service Type</label>
                        <select 
                          name="serviceType" 
                          value={walkinData.serviceType} 
                          onChange={handleWalkinChange} 
                          required 
                          className={`w-full px-4 py-3 rounded-xl border bg-white text-black outline-none transition-all ${walkinErrors.serviceType ? 'border-red-500' : 'border-gray-300'}`}
                        >
                          <option value="">Select Service</option>
                          <option value="Regular Checkup">Regular Checkup</option>
                          <option value="Dental Cleaning">Dental Cleaning</option>
                          <option value="Tooth Filling">Tooth Filling</option>
                          <option value="Tooth Extraction">Tooth Extraction</option>
                          <option value="Teeth Whitening">Teeth Whitening</option>
                          <option value="Braces Consultation">Braces Consultation</option>
                          <option value="Other">Other</option>
                        </select>
                        {walkinErrors.serviceType && <p className="text-[10px] text-red-500 font-bold ml-1">{walkinErrors.serviceType[0]}</p>}
                        
                        {/* 🛡️ MANDATORY OTHER INPUT */}
                        {walkinData.serviceType === 'Other' && (
                          <div className="mt-2">
                            <input 
                              type="text" 
                              name="customService" 
                              maxLength={255}
                              value={walkinData.customService} 
                              onChange={handleWalkinChange} 
                              placeholder="Please specify dental service" 
                              required={true} // 🛡️ Explicitly required
                              className={`w-full px-4 py-2 rounded-lg border bg-white text-black outline-none transition-all ${walkinErrors.customService ? 'border-red-500' : 'border-gray-300'}`} 
                            />
                            {walkinErrors.customService && (
                              <p className="text-[10px] text-red-500 font-bold ml-1 mt-1">{walkinErrors.customService[0]}</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="text-xs font-bold text-gray-700 uppercase ml-1">Assign Dentist</label>
                        <select 
                          name="preferredDentist" 
                          value={walkinData.preferredDentist} 
                          onChange={handleWalkinChange} 
                          required 
                          className={`w-full px-4 py-3 rounded-xl border bg-white text-black outline-none ${walkinErrors.preferredDentist ? 'border-red-500' : 'border-gray-300'}`}
                        >
                          <option value="">Select Dentist</option>
                          {dentists.map(d => <option key={d.id} value={d.email}>Dr. {d.name}</option>)}
                        </select>
                        {walkinErrors.preferredDentist && <p className="text-[10px] text-red-500 font-bold ml-1">{walkinErrors.preferredDentist[0]}</p>}
                      </div>

                      {/* 🛡️ DATE SELECTION SECTION (Now with explicit required logic) */}
                      <div className="space-y-1 text-left">
                        <label className="text-xs font-bold text-gray-700 uppercase ml-1">
                          Preferred Date <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <DatePicker
                            selected={walkinData.appointmentDate ? new Date(walkinData.appointmentDate) : null}
                            onChange={(date) => {
                              if (!date) return;
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const day = String(date.getDate()).padStart(2, '0');
                              setWalkinData({...walkinData, appointmentDate: `${year}-${month}-${day}`});
                              // Clear error immediately upon selection
                              if (walkinErrors.appointmentDate) {
                                const newErrors = { ...walkinErrors };
                                delete newErrors.appointmentDate;
                                setWalkinErrors(newErrors);
                              }
                            }}
                            filterDate={(date) => date.getDay() !== 0} 
                            minDate={new Date(new Date().setDate(new Date().getDate() + 1))} 
                            maxDate={sixMonthsFromNow}
                            dateFormat="yyyy-MM-dd"
                            placeholderText="Select Date"
                            onKeyDown={(e) => e.preventDefault()} 
                            autoComplete="off"
                            // 🛡️ Added required prop for accessibility and validation
                            required={true}
                            className={`w-full px-4 py-3 rounded-xl border bg-white text-black outline-none transition-all cursor-pointer ${
                              walkinErrors.appointmentDate ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                        </div>
                        {walkinErrors.appointmentDate && (
                          <p className="text-[10px] text-red-500 font-bold ml-1">{walkinErrors.appointmentDate[0]}</p>
                        )}
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="text-xs font-bold text-gray-700 uppercase ml-1">Time Slot</label>
                        <select 
                          name="preferredTime" 
                          value={walkinData.preferredTime} 
                          onChange={handleWalkinChange} 
                          required 
                          className={`w-full px-4 py-3 rounded-xl border bg-white text-black outline-none ${walkinErrors.preferredTime ? 'border-red-500' : 'border-gray-300'}`}
                        >
                          <option value="">Select Time</option>
                          {["07:00 AM", "09:00 AM", "11:00 AM", "01:00 PM", "03:00 PM", "05:00 PM"].map(time => {
                            const isTaken = takenSlots.includes(time.toUpperCase());
                            return <option key={time} value={time} disabled={isTaken}>{time} {isTaken ? "(Booked)" : ""}</option>;
                          })}
                        </select>
                        {walkinErrors.preferredTime && <p className="text-[10px] text-red-500 font-bold ml-1">{walkinErrors.preferredTime[0]}</p>}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="p-6 border-t bg-white flex justify-end gap-3 sticky bottom-0">
              {/* 🛡️ Updated: White text color */}
              <button 
                type="button" 
                onClick={() => setIsWalkinModalOpen(false)} 
                className="px-6 py-3 font-bold text-white bg-[#1a1a1a] hover:bg-gray-100 hover:text-black rounded-xl border-none cursor-pointer transition-all"
              >
                Cancel
              </button>

              {/* 🛡️ Updated: Hover effect copied from Cancel button */}
              <button 
                type="submit" 
                className="px-10 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-100 hover:text-black border-none cursor-pointer shadow-lg shadow-black/10 transition-all"
              >
                Register Walk-in
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
