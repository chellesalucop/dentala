import React, { useState, useEffect } from 'react';
import { API_URL } from '../api';
import { CheckCircle, XCircle, Calendar, X, AlertTriangle, Info, Clock, User, Mail, Phone } from 'lucide-react';

export default function AdminDashboardPage() {
  const [todaysSchedule, setTodaysSchedule] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [serverDate, setServerDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // States for Feedback and Confirmation
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [confirmModal, setConfirmModal] = useState({ 
    show: false, 
    apptId: null, 
    action: '', 
    reason: '' // New state for the reason
  });

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
  };

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/api/admin/dashboard-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });
      
      const data = await response.json(); // Parse JSON regardless of status to see error messages

      if (response.ok) {
        setTodaysSchedule(data.todaysSchedule || []);
        setPendingApprovals(data.pendingApprovals || []);
        setServerDate(data.today || "");
      } else {
        // Log the specific error message from the backend (like "Str not found")
        console.error("Dashboard Error Detail:", data.message);
      }
    } catch (error) {
      console.error("Network/System Error:", error);
    } finally {
      setIsLoading(false); // Ensure this ALWAYS runs to stop the blank loading state
    }
  };

  const handleActionConfirm = async (id, status) => {
    if (status === 'confirmed') {
      // 🛡️ ACCIDENTAL CLICK GUARD: Approval Alert
      const confirmApprove = window.confirm("Are you sure you want to APPROVE this appointment? The patient will be notified.");
      if (!confirmApprove) return;
      handleUpdateStatus(id, 'confirmed');
    }

    if (status === 'declined') {
      // 🛡️ DECLINE GUARD: Mandatory Reason Prompt
      const reason = window.prompt("Please provide a reason for declining this appointment:");
      
      if (reason === null) return; // User clicked Cancel
      if (reason.trim() === "") {
        showAlert("A reason is required to decline an appointment.", 'error');
        return;
      }
      
      handleUpdateStatus(id, 'declined', reason);
    }
  };

  const handleUpdateStatus = async (id, newStatus, reason = '') => {
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
          cancellation_reason: reason // Send reason to backend
        })
      });

      if (response.ok) {
        showAlert(`Appointment ${newStatus}!`, 'success');
        setConfirmModal({ show: false, apptId: null, action: '', reason: '' });
        fetchDashboardData();
      } else {
        showAlert("Failed to update.", 'error');
      }
    } catch (error) {
      showAlert("Server error.", 'error');
    }
  };

  return (
    <div className="text-black text-left relative min-h-screen">
      
      {/* 1. NOTIFICATION ALERT */}
      {alert.show && (
        <div className={`fixed top-5 right-5 z-[110] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border animate-fade-in-up bg-[#1a1a1a] text-white border-gray-800`}>
          <span className="font-bold">{alert.message}</span>
        </div>
      )}

      {/* 2. CONFIRMATION MODAL */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-bold mb-2">Decline Appointment</h2>
            <p className="text-gray-500 mb-4 font-medium">You are about to decline this appointment. This action cannot be undone.</p>
            
            {/* Optional Reason Field */}
            <textarea 
              placeholder="Reason for declining (optional)..."
              className="w-full p-3 border border-gray-200 rounded-lg mb-4 text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none"
              rows="3"
              value={confirmModal.reason}
              onChange={(e) => setConfirmModal({...confirmModal, reason: e.target.value})}
            />
            
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmModal({ show: false, apptId: null, action: '', reason: '' })}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition cursor-pointer border-none"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleUpdateStatus(confirmModal.apptId, 'cancelled', confirmModal.reason)}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition cursor-pointer border-none"
              >
                Yes, Decline
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">Review and manage today's clinical queue</p>
      </div>

      {/* items-start prevents the left box from stretching to match the right box */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Today's Schedule (Left) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 lg:p-8 shadow-sm">
          <h2 className="text-lg font-semibold italic mb-6">Today's Schedule ({serverDate})</h2>
          <div className="space-y-4">
            {todaysSchedule.length === 0 ? <p className="text-gray-400 italic py-10 text-center">No appointments today.</p> : 
              todaysSchedule.map(appt => (
                <div key={appt.id} className={`p-4 rounded-xl border transition-all ${
                  appt.status === 'expired' 
                    ? 'bg-gray-100 border-gray-200 opacity-60' 
                    : 'bg-white border-blue-100 shadow-sm hover:shadow-md'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-gray-900 truncate pr-2">{appt.full_name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${
                      appt.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                      appt.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {appt.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span className="font-black text-gray-700">{appt.preferred_time}</span>
                    </div>
                    <div className="flex items-center gap-1 uppercase tracking-widest text-[9px]">
                      {appt.service_type === 'Other' ? (appt.custom_service || 'Other') : appt.service_type}
                    </div>
                  </div>
                </div>
              ))
            }

          </div>
        </div>

        {/* Pending Approvals (Right) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 lg:p-8 shadow-sm">
          <h2 className="text-lg font-semibold italic mb-6">Pending Approvals ({pendingApprovals.length})</h2>
          <div className="space-y-4">
            {pendingApprovals.map(appt => (
              <div key={appt.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-md flex flex-col gap-4 animate-fade-in-up">
                
                {/* 1. Header: Service Type */}
                <div className="text-left">
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                    {appt.service_type === 'Other' 
                      ? `${appt.custom_service || 'Other'}` 
                      : appt.service_type}
                  </h3>
                  
                  {/* 2. Date and Time Icons */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs font-medium text-gray-500 mt-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Calendar className="w-3.5 h-3.5 text-[#5b9bd5]" />
                      {new Date(appt.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1.5 font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                      <Clock className="w-3.5 h-3.5" />
                      {appt.preferred_time}
                    </div>
                  </div>
                </div>

                {/* 3. Patient Name and Metadata */}
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <p className="text-sm font-black text-black">
                     Patient: {appt.full_name}
                  </p>
                  <div className="text-[10px] text-gray-400 font-bold italic mt-1">
                    Booked on: {appt.created_at ? new Date(appt.created_at).toLocaleString('en-US', { 
                      month: 'short', day: 'numeric', year: 'numeric', 
                      hour: 'numeric', minute: '2-digit', hour12: true 
                    }) : 'N/A'}
                  </div>
                </div>

                {/* 4. Action Buttons */}
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => openModal(appt)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-[#5b9bd5] text-[#5b9bd5] font-bold rounded-xl hover:bg-blue-50 transition-all cursor-pointer shadow-sm"
                  >
                    <Info className="w-4 h-4" /> View Details
                  </button>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleActionConfirm(appt.id, 'confirmed')}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold rounded-xl transition-all cursor-pointer border-none shadow-sm"
                    >
                      <CheckCircle className="w-4 h-4" /> Confirm
                    </button>
                    <button 
                      onClick={() => handleActionConfirm(appt.id, 'declined')}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1a1a1a] hover:bg-[#333333] text-white font-bold rounded-xl transition-all cursor-pointer border-none shadow-sm"
                    >
                      <XCircle className="w-4 h-4" /> Decline
                    </button>
                  </div>
                </div>

              </div>
            ))}

          </div>
        </div>
      </div>

      {/* MODAL: Patient Information (Dashboard View) */}
      {isModalOpen && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[130] p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900 text-left">Patient Information</h2>
              <button onClick={() => setIsModalOpen(false)} className="bg-black hover:bg-gray-800 text-white p-1.5 rounded-full transition-colors flex items-center justify-center border-none cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-8 text-left">
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
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. Service Requested Section */}
              <section>
                <h4 className="text-xs uppercase text-black font-bold mb-3 tracking-[0.2em]">Service Requested</h4>
                <p className="text-lg font-bold text-gray-900 break-words whitespace-pre-wrap">
                  {selectedAppointment.service_type === 'Other' 
                    ? `${selectedAppointment.custom_service || 'Other'}` 
                    : selectedAppointment.service_type}
                </p>
                <p className="text-sm font-bold text-blue-600 mt-1">
                   {new Date(selectedAppointment.appointment_date).toLocaleDateString()} at {selectedAppointment.preferred_time}
                </p>
              </section>

              {/* 3. Clinical & Medical Section */}
              <section className="pt-8 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-xs uppercase text-black font-bold mb-3 tracking-[0.2em]">Medical Conditions</h4>
                    <p className="text-sm text-gray-700 leading-relaxed font-medium">
                      {(() => {
                        const medicalConditions = selectedAppointment?.medical_conditions;
                        if (Array.isArray(medicalConditions)) return medicalConditions.join(', ') || 'None';
                        if (typeof medicalConditions === 'string') {
                          try { return JSON.parse(medicalConditions).join(', ') || 'None'; } catch (e) { return medicalConditions || 'None'; }
                        }
                        return 'None';
                      })()}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs uppercase text-black font-bold mb-3 tracking-[0.2em]">Clinical Notes</h4>
                    <p className="text-sm text-gray-600 italic">
                      {selectedAppointment.others || 'None provided.'}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}