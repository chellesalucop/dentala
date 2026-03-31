import React, { useState, useEffect } from 'react';
import { API_URL } from '../api';
import { CheckCircle, XCircle, Calendar, X, AlertTriangle } from 'lucide-react';

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
                <div key={appt.id} className={`bg-gray-50 p-4 rounded-xl border border-transparent min-w-0 ${appt.status === 'expired' ? 'bg-gray-200 opacity-50' : ''}`}>
                  <div className="flex justify-between items-start">
                    {/* 🛡️ Added break-all and line-clamp to prevent stretching */}
                    <p className="font-bold break-all line-clamp-1 text-black">{appt.full_name}</p>
                    {/* 🛡️ SYNC: Use the updated_at field we added to the backend select array */}
                    <span className="text-[10px] font-bold italic text-gray-400 whitespace-nowrap ml-2">
                      {appt.status === 'confirmed' ? 'Confirmed: ' : 
                       appt.status === 'completed' ? 'Completed: ' : 
                       appt.status === 'expired' ? 'Expired: ' : 'Syncing...'}
                      
                      <span className={appt.status === 'expired' ? 'text-black font-black' : ''}>
                        {appt.updated_at ? new Date(appt.updated_at).toLocaleDateString() : 'Pending'}
                      </span>
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {appt.service_type === 'Other' ? `Other (${appt.custom_service || 'No details'})` : appt.service_type}
                    <span className="mx-1">•</span> 
                    <span className="font-black text-gray-700">{appt.preferred_time}</span>
                  </p>
                </div>
              ))
            }
          </div>
        </div>

        {/* Pending Approvals (Right) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 lg:p-8 shadow-sm">
          <h2 className="text-lg font-semibold italic mb-6">Pending Approvals</h2>
          <div className="space-y-4">
            {pendingApprovals.map(appt => (
              <div key={appt.id} className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm min-w-0">
                <div className="flex justify-between items-center mb-1">
                  {/* 🛡️ Guard against the "DDDD..." name issue */}
                  <h3 className="font-bold text-lg break-all line-clamp-2 leading-tight text-black">
                    {appt.full_name}
                  </h3>
                  {/* 🛡️ SYNC: Show original booking time for triage */}
                  <span className="text-[10px] text-gray-400 font-bold italic whitespace-nowrap ml-2">
                    Booked: {appt.created_at ? new Date(appt.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {appt.service_type === 'Other' ? `Other (${appt.custom_service || 'No details'})` : appt.service_type} • {appt.preferred_time}
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleActionConfirm(appt.id, 'confirmed')} // 🛡️ Updated handler
                    className="flex-1 py-2 bg-[#22c55e] text-white font-bold rounded-lg cursor-pointer border-none transition-all hover:bg-[#16a34a]"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleActionConfirm(appt.id, 'declined')} // 🛡️ Updated handler
                    className="flex-1 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg cursor-pointer border-none transition-all hover:bg-gray-200"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}