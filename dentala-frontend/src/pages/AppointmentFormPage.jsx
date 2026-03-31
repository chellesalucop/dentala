import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { API_URL } from '../api';

export default function AppointmentFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showOthers, setShowOthers] = useState(false);
  const [showOtherService, setShowOtherService] = useState(false);
  const [showOtherServiceInput, setShowOtherServiceInput] = useState(false);
  const [isSunday, setIsSunday] = useState(false); // Sunday detection state
  const [dentists, setDentists] = useState([]); // Dynamic dentists list
  const [selectedDentistId, setSelectedDentistId] = useState(''); // Track selected dentist ID
  const [isLoadingDentists, setIsLoadingDentists] = useState(true);
  const [takenSlots, setTakenSlots] = useState([]); // Blacklisted time slots

  // Initialize: Use the passed state if it exists, otherwise empty
  const [formData, setFormData] = useState(
    location.state?.formData || {
      fullName: '', // Maps to phpMyAdmin Column 3
      phone: '',     // Maps to phpMyAdmin Column 4
      email: '',     // Maps to phpMyAdmin Column 5
      medicalConditions: [], // Array for checkboxes
      serviceType: '',
      customService: '', // New field for "Other" service details
      otherServiceDetails: '',
      preferredDentist: '',
      others: '',
      appointmentDate: '',
      preferredTime: ''
    }
  );

  // 🛡️ THE REFRESH GUARD
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // 🛡️ Only warn if there's actual data typed in (e.g., fullName or phone exists)
      if (formData.fullName || formData.phone || formData.appointmentDate) {
        e.preventDefault();
        e.returnValue = ''; // 🛡️ This triggers the browser's standard confirmation dialog
      }
    };

    // Add the listener when the component mounts
    window.addEventListener('beforeunload', handleBeforeUnload);

    // CRITICAL: Remove the listener when the component unmounts
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [formData]); // Re-run if formData changes to stay accurate

  // --- FETCH REGISTERED DENTISTS ---
  useEffect(() => {
    const loadDentists = async () => {
      setIsLoadingDentists(true);
      try {
        const response = await fetch(`${API_URL}/api/dentists`, {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Accept': 'application/json'
          }
        });
        const data = await response.json();
        
        // DEBUG: Check the console (F12) to see if this is []
        console.log("Dentists received:", data.dentists); 
        
        if (response.ok) {
          setDentists(data.dentists);
        }
      } catch (err) {
        console.error("Critical: Dentist fetch failed:", err);
      } finally {
        setIsLoadingDentists(false);
      }
    };

    loadDentists();
  }, []); // 👈 CRITICAL: This empty array [] ensures it ONLY runs once!

  // THE "CONSUME AND CLEAR" LOGIC
  useEffect(() => {
    // If we arrived with a suitcase (from Edit button)...
    if (location.state?.formData) {
      // 1. First, make sure our local formData matches suitcase
      setFormData(location.state.formData);

      // 2. 🛡️ CRITICAL: Replace current history entry with NO STATE
      // This "consumes" the data so a Refresh finds nothing.
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, []); // Empty array means this ONLY runs once on page load

  // 🛡️ SYNC SELECTED DENTIST ID when restoring from edit mode
  useEffect(() => {
    if (formData.preferredDentist && dentists.length > 0) {
      // Find dentist by email and set the ID
      const dentist = dentists.find(d => d.email === formData.preferredDentist);
      if (dentist) {
        setSelectedDentistId(String(dentist.id));
      }
    }
  }, [formData.preferredDentist, dentists]);

  // 🛡️ THE "WAKE UP" EFFECT
  useEffect(() => {
    // 1. Service Type Resurrection (Already working)
    if (formData.serviceType === 'Other') {
      setShowOtherServiceInput(true);
    }
    
    // 2. 🛡️ MEDICAL "OTHERS" RESURRECTION
    // We check if the array contains the specific label for the 'Other' checkbox
    if (formData.medicalConditions && formData.medicalConditions.includes('Others (please specify)')) {
      setShowOthers(true); // 👈 This flips the toggle to show the text area
    }
  }, [formData.serviceType, formData.medicalConditions]); // Runs when data is restored

  // 🛡️ FE-APPT-FORM-NORMALIZATION: Optimized for the new BE-SLOT-STATUS-GUARD format
  useEffect(() => {
    const fetchTakenSlots = async () => {
      if (!formData.appointmentDate) return;
      
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_URL}/api/appointments/check-slots?date=${formData.appointmentDate}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json' 
          }
        });

        if (!response.ok) throw new Error("Backend Conflict Check Failed");

        const data = await response.json();
        
        // 🛡️ SIMPLIFIED MATCH: The backend now sends "05:00 PM" directly
        // We just ensure they are uppercase for a perfect match with the dropdown array.
        const apiTaken = (data.taken_times || []).map(time => time.toUpperCase());

        setTakenSlots(apiTaken);
        
        // Auto-clear if currently selected time is taken
        if (apiTaken.includes(formData.preferredTime.toUpperCase())) {
          setFormData(prev => ({ ...prev, preferredTime: '' }));
        }
      } catch (err) {
        console.error("Conflict Guard Error:", err);
      }
    };

    fetchTakenSlots();
  }, [formData.appointmentDate]);

  // ZONE B: APPOINTMENTS ONLY - Flexible Hub Validation
  // Frontend Synchronize Label: Appointment-Full-String-Email-Validation
  const validateBookingEmail = (email) => {
    // 🔧 SYNCED REGEX: Matching Backend's {2,4} limit exactly
    // Blocks: @@, multiple @, invalid endings (.comjh), missing extensions, etc.
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address.";
    }
    return ""; // No domain restriction here!
  };

  // 🛡️ THE PRODUCTION CONSTRAINTS: Same-Day Booking Block
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1); // Move to tomorrow

  // 🛡️ THE 6-MONTH HORIZON: Get the date exactly 6 months from today
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

  // Logic to filter out Sundays (0)
  const isWeekday = (date) => {
    const day = date.getDay();
    return day !== 0; 
  };

  // Handle React DatePicker change
  const handleDatePickerChange = (date) => {
    if (!date) return;
    
    // Converts JS Date to Laravel-friendly String (YYYY-MM-DD)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    setFormData({
      ...formData,
      appointmentDate: formattedDate 
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === "checkbox") {
      if (value === "Others (please specify)") {
        setShowOthers(checked);
      }

      const updatedConditions = checked 
        ? [...formData.medicalConditions, value]
        : formData.medicalConditions.filter(c => c !== value);
      
      setFormData(prev => ({ ...prev, medicalConditions: updatedConditions }));
      return;
    }

    if (name === "fullName") {
      const sanitized = value.replace(/[^A-Za-z\s.\-']/g, ''); 
      setFormData(prev => ({ ...prev, [name]: sanitized }));
      return;
    }

    if (name === "phone") {
      const onlyNums = value.replace(/[^0-9]/g, '');
      if (onlyNums.length <= 11) {
        setFormData(prev => ({ ...prev, [name]: onlyNums }));
      }
      return;
    }

    if (name === "email") {
      setFormData(prev => ({ ...prev, [name]: value }));
      return;
    }

    if (name === 'serviceType') {
      setShowOtherServiceInput(value === 'Other');
    }

    if (name === 'custom_service') {
      setFormData(prev => ({ ...prev, customService: value }));
      return;
    }

    if (name === "preferredDentist") {
      setSelectedDentistId(value); // Track selected ID
      const selectedDentist = dentists.find(d => String(d.id) === String(value));
      
      setFormData(prev => ({ 
        ...prev, 
        preferredDentist: selectedDentist ? selectedDentist.email : "" 
      }));
      
      console.log('🔄 Nuclear ID Match:', {
        selectedId: value,
        foundEmail: selectedDentist?.email
      });
      return;
    }

    if (name === 'others') {
      setFormData(prev => ({ ...prev, others: value }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Create the final payload to send to backend
    const payload = {
      ...formData,
      // 🛡️ THE CRITICAL FIX: Explicitly map the fields
      // Ensure that dental service details go to 'custom_service'
      // Ensure that medical notes go to 'others'
      custom_service: formData.customService, 
      others: formData.others,
      service_type: formData.serviceType
    };

    console.log("SENDING TO BACKEND:", payload); // 🔍 Check this in your console before clicking!

    navigate('/appointment/summary', { state: { formData: payload } });
  };

  const inputBaseClass = "w-full p-2.5 bg-white text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5b9bd5] text-sm placeholder-gray-500";

  /* FORCE LIGHT THEME ON DATE PICKER */
  const datePickerStyles = `
    input[type="date"] {
      color-scheme: light !important; /* This kills black background */
      background-color: white !important;
    }
    
    /* Optional: Removes the default 'dark' look on some browsers */
    input[type="date"]::-webkit-calendar-picker-indicator {
      filter: none !important; 
      cursor: pointer !important;
    }

    /* FORCE LIGHT THEME ON REACT-DATEPICKER */
    .react-datepicker-wrapper,
    .react-datepicker {
      color-scheme: light !important; /* This kills black background */
      background-color: white !important;
      color: #111827 !important; /* Deep Navy/Black (#111827) from Audit */
      border-color: #d1d5db !important; /* border-gray-300 from Key Visibility Fixes */
    }

    /* Ensure selected dates are blue, but not dark */
    .react-datepicker__day--selected {
      background-color: #5b9bd5 !important; /* focus:ring-2 focus:ring-[#5b9bd5] from CSS Correction Applied */
      color: white !important;
    }

    /* Ensure greyed-out Sundays look professional */
    .react-datepicker__day--disabled {
      color: #9ca3af !important; /* text-gray-500 from Visibility Audit */
      background-color: #f9fafb !important;
    }

    /* 🛡️ THE FOCUS-GHOST KILLER: Stop the '30' from highlighting in other months */

    /* 1. Neutralize the background for the "keyboard focus" day in all months */
    .react-datepicker__day--keyboard-selected {
      background-color: transparent !important; 
      color: #111827 !important; /* Keep text Navy/Black */
      border: none !important;
    }

    /* 2. Only allow the blue background for the actual chosen date */
    .react-datepicker__day--selected {
      background-color: #5b9bd5 !important;
      color: white !important;
      border-radius: 4px !important;
    }

    /* 3. Maintain hover state for interactivity */
    .react-datepicker__day:hover {
      background-color: #eff6ff !important;
      color: #5b9bd5 !important;
    }

    /* FORCE DATEPICKER WRAPPER TO STRETCH */
    .react-datepicker-wrapper {
        display: block !important;
        width: 100% !important;
    }

    .react-datepicker__input-container {
        display: block !important;
        width: 100% !important;
    }
  `;

  const conditions = [
    "Toothache", 
    "Wisdom Tooth Pain", 
    "Sensitive Teeth", 
    "Broken/Chipped Tooth", 
    "Cavity", 
    "Loose Tooth", 
    "Bleeding Gums",
    "Bad Breath",
    "Cosmetic Improvement" // 🛡️ MOVED UP: Now part of the 2-column grid
  ];

  return (
  <> 
    <style>{datePickerStyles}</style>
    
    {/* 🛡️ THE WIDENESS FIX: Changed to max-w-3xl for focused width */}
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      
      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-10 rounded-xl shadow-lg border border-gray-200">
      
      {/* 1. Header (Friendly Gray-800) */}
      <div className="flex items-center gap-2 font-bold text-lg mb-6 border-b pb-2 text-gray-800">
        <img src="/images/calendar.png" alt="" className="w-5 h-5 opacity-70" />
        Appointment Details
      </div>

      {/* 2. Section: Personal Information */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-800 text-left">Personal Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1 uppercase">
              Full Name
            </label>
            <input type="text" name="fullName" maxLength={255} value={formData.fullName} onChange={handleChange} className={inputBaseClass} placeholder="Enter your full name" required />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1 uppercase">
              Phone Number
            </label>
            <input type="text" name="phone" maxLength={255} value={formData.phone} onChange={handleChange} className={inputBaseClass} placeholder="Enter phone number" required />
          </div>
        </div>

        {/* Single Email Field */}
        <div className="w-full">
          <label className="block text-[13px] font-medium text-gray-700 mb-1 uppercase">
            Email Address
          </label>
          <input type="text" name="email" maxLength={255} value={formData.email} onChange={handleChange} className={inputBaseClass} placeholder="Enter email address" required />
        </div>
      </section>

      <hr className="mb-8 border-gray-100" />
      
      {/* 3. Section: Appointment Information */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-800 text-left">Appointment Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase text-gray-700">Service Type</label>
            <select 
              name="serviceType" 
              value={formData.serviceType || ""} 
              onChange={handleChange} 
              className="w-full p-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white outline-none focus:ring-2 focus:ring-[#5b9bd5]"
              required
            >
              <option value="" disabled={formData.serviceType}>Select a service</option>
              <option value="Regular Checkup">Regular Checkup</option>
              <option value="Dental Cleaning">Dental Cleaning</option>
              <option value="Tooth Filling">Tooth Filling</option>
              <option value="Tooth Extraction">Tooth Extraction</option>
              <option value="Teeth Whitening">Teeth Whitening</option>
              <option value="Braces Consultation">Braces Consultation</option>
              <option value="Other">Other</option>
            </select>
            {showOtherServiceInput && (
              <input
                type="text"
                name="custom_service"
                maxLength={255}
                value={formData.customService || ''}
                onChange={handleChange}
                placeholder="Please specify dental service"
                className="w-full mt-3 p-2 border border-gray-300 bg-white rounded-md text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-[#5b9bd5] transition-all"
                required
              />
            )}
          </div>
          
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1 uppercase">
              Preferred Dentist
            </label>
            <select 
              name="preferredDentist" 
              value={selectedDentistId}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 focus:ring-2 focus:ring-[#5b9bd5] outline-none transition-all cursor-pointer"
            >
              <option value="" className="text-gray-400">Select a dentist</option>
              {dentists.map(dentist => (
                <option key={dentist.id} value={dentist.id}>
                  Dr. {dentist.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <hr className="mb-8 border-gray-200" />
      
      {/* 4. Section: Medical Conditions */}
      <section className="mb-8">
        <div className="mb-4 text-left">
          <h2 className="text-xl font-bold text-gray-800">Any Medical Condition?</h2>
          <p className="text-[12px] text-gray-500 italic">Select all that apply, or leave blank if none.</p>
        </div>

        {/* 🛡️ THE SYMMETRY GRID: Now holds all standard conditions in 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 mb-4">
          {conditions.map(condition => (
            <label key={condition} className="flex items-center gap-3 cursor-pointer text-sm text-black font-normal text-left">
              <input 
                type="checkbox" 
                name="medicalConditions" 
                maxLength={255}
                value={condition} 
                checked={formData.medicalConditions.includes(condition)}
                onChange={handleChange} 
                className="w-4 h-4 rounded border border-gray-400 bg-white appearance-none checked:bg-[#5b9bd5] checked:bg-checkmark bg-center bg-no-repeat checked:border-transparent transition-all focus:ring-[#5b9bd5]"
                style={{ colorScheme: 'light' }} 
              />
              {condition}
            </label>
          ))}
        </div>
        
        {/* 🛡️ THE DEDICATED OTHERS SECTION: Isolated at the bottom */}
        <div className="text-left border-t border-gray-50 pt-4">
           <label className="flex items-center gap-3 cursor-pointer text-sm text-black font-normal">
             <input 
               type="checkbox" 
               name="medicalConditions" 
               maxLength={255}
               value="Others (please specify)" 
               checked={formData.medicalConditions.includes("Others (please specify)")}
               onChange={handleChange} 
               className="w-4 h-4 rounded border border-gray-400 bg-white appearance-none checked:bg-[#5b9bd5] checked:bg-checkmark bg-center bg-no-repeat checked:border-transparent transition-all focus:ring-[#5b9bd5]"
               style={{ colorScheme: 'light' }}
             />
             Others (please specify)
           </label>
           {showOthers && (
            <div className="mt-3">
              <textarea
                name="others"
                value={formData.others || ''}
                onChange={handleChange}
                placeholder="Please specify medical condition"
                className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white text-black placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#5b9bd5]"
                rows="3"
              />
            </div>
          )}
        </div>
      </section>

      <hr className="mb-8 border-gray-200" />
      
      {/* 5. Section: Schedule */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 text-gray-800 text-left">Select Schedule</h2>
        
        {/* 🛡️ THE ALIGNMENT SYNC: Twin columns with identical label styles */}
        <div className="flex flex-col md:flex-row gap-6 items-start w-full">
          
          <div className="flex-1 w-full">
            <label className="block text-[13px] font-medium text-gray-700 mb-1 uppercase text-left">
              Preferred Schedule
            </label>
            
            <div className="relative w-full"> 
              <DatePicker
                selected={formData.appointmentDate ? new Date(formData.appointmentDate) : null}
                onChange={handleDatePickerChange}
                filterDate={(date) => date.getDay() !== 0}
                minDate={tomorrow} // 🛡️ RE-ENABLED: No same-day bookings
                maxDate={sixMonthsFromNow} // 🛡️ RE-ENABLED: 6-month limit
                onFocus={(e) => e.target.blur()}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select date"
                className="w-full p-2 pr-10 border border-gray-300 rounded-md text-sm text-gray-700 bg-white cursor-pointer outline-none focus:ring-2 focus:ring-[#5b9bd5]"
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full">
            <label className="block text-[13px] font-medium text-gray-700 mb-1 uppercase text-left">
              Preferred Time
            </label>
            <select 
              name="preferredTime"
              value={formData.preferredTime}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white outline-none focus:ring-2 focus:ring-[#5b9bd5] cursor-pointer"
            >
              <option value="">Select time</option>
              {["07:00 AM", "09:00 AM", "11:00 AM", "01:00 PM", "03:00 PM", "05:00 PM" ].map(time => {
                // 🛡️ Check if this slot is in the global 'takenSlots' blacklist
                const isTaken = takenSlots.includes(time.toUpperCase());
                
                return (
                  <option key={time} value={time} disabled={isTaken}>
                    {time} {isTaken ? " — (Booked)" : ""}
                  </option>
                );
              })}
            </select>
          </div>

        </div>
      </section>

      {/* 6. Submit Button (Brand Blue) */}
      <button 
        type="submit" 
        className="w-full py-4 rounded-lg font-bold bg-[#5b9bd5] text-white hover:bg-[#4a8ac4] transition-all mt-6"
      >
        Review Appointment
      </button>

    </form>
    </div> 
  </> 
);
}
