import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarIcon, Clock, MapPin, ChevronDown, X, AlertCircle, Save, User, Mail, Phone, Trash2 } from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function MyAppointmentsPage() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [appointments, setAppointments] = useState([]);
  const [dentists, setDentists] = useState([]); // Fetch dentists for reverse lookup
  const [isLoading, setIsLoading] = useState(true);
  
  // Load More state
  const [visibleCount, setVisibleCount] = useState(16); // Default to 16 for patients
  
  // Tab change handler with reset logic
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setVisibleCount(16); // 🛡️ Resets the view so they don't start halfway down a list
  };
  
  // States for Rescheduling
  const [editingId, setEditingId] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [takenSlots, setTakenSlots] = useState([]); // 🛡️ Blacklisted time slots

  // 🛡️ THE PRODUCTION CONSTRAINTS: Same-Day Booking Block
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1); // Move to tomorrow

  // 🛡️ THE 6-MONTH HORIZON: Get the date exactly 6 months from today
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

  // 🛡️ THE INSTANT-SYNC FIX: This function handles the "First Click" perfectly
  const handleRescheduleDateChange = async (date) => {
    if (!date) return;

    // 1. Immediately format the date string
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    // 2. Update the visual state immediately
    setNewDate(formattedDate);

    // 3. 🛡️ CRITICAL: Fetch slots using formattedDate (NOT the newDate state variable)
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://127.0.0.1:8000/api/appointments/check-slots?date=${formattedDate}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json' 
        }
      });
      const data = await response.json();
      
      // 4. Normalize and update taken slots immediately for the UI
      const apiTaken = (data.taken_times || []).map(time => {
        const rawTime = time.includes(' ') ? time.split(' ')[1] : time;
        const [hours, minutes] = rawTime.split(':');
        const tempDate = new Date();
        tempDate.setHours(parseInt(hours), parseInt(minutes), 0);
        return tempDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        }).toUpperCase();
      });

      setTakenSlots(apiTaken);
    } catch (err) {
      console.error("Instant Sync Error:", err);
    }
  };

  // 🛡️ THE EXACT-MATCH FIX: Converts all DB formats to "7:00 AM" style
  useEffect(() => {
    const fetchTakenSlots = async () => {
      if (!newDate) return;
      
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`http://127.0.0.1:8000/api/appointments/check-slots?date=${newDate}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        // 🛡️ NORMALIZER: Converts "19:00" or "07:00:00" to "7:00 PM" / "7:00 AM"
        const apiTaken = (data.taken_times || []).map(time => {
          const rawTime = time.includes(' ') ? time.split(' ')[1] : time;
          const [hours, minutes] = rawTime.split(':');
          const tempDate = new Date();
          tempDate.setHours(parseInt(hours), parseInt(minutes), 0);
          
          return tempDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
          }).toUpperCase(); 
        });

        // Also normalize local pending appointments in your current view
        const localPending = appointments
          .filter(app => 
            app.appointment_date === newDate && 
            app.id !== editingId &&
            (app.status === 'pending' || app.status === 'confirmed') // ✅ Only block active ones
          )
          .map(app => app.preferred_time.toUpperCase());

        setTakenSlots([...new Set([...apiTaken, ...localPending])]);
        
        if (apiTaken.includes(newTime.toUpperCase()) || localPending.includes(newTime.toUpperCase())) {
          setNewTime(''); 
        }
      } catch (err) {
        console.error("Error fetching slots:", err);
      }
    };
    fetchTakenSlots();
  }, [newDate, appointments, editingId]);

  // 🛡️ Custom DatePicker styling to match AppointmentFormPage
  const datePickerStyles = `
    .react-datepicker {
      font-family: inherit;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      background: white;
    }
    .react-datepicker__header {
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
    }
    .react-datepicker__day--disabled {
      color: #d1d5db !important;
      pointer-events: none !important;
      background-color: #f9fafb !important;
    }
    
    /* 🛡️ THE GHOST INDICATOR KILLER */
    
    /* 1. Neutralize the 'keyboard focus' day so it doesn't highlight across months */
    .react-datepicker__day--keyboard-selected {
      background-color: transparent !important;
      color: #111827 !important; /* Matches your Deep Navy/Black text */
      border: none !important;
      outline: none !important;
    }
    
    /* 2. Ensure the actual selected day remains the only highlight */
    .react-datepicker__day--selected {
      background-color: #5b9bd5 !important;
      color: white !important;
      border-radius: 8px !important;
    }
    
    /* 3. Maintain hover interactivity without creating 'ghosts' */
    .react-datepicker__day:hover {
      background-color: #eff6ff !important;
      color: #5b9bd5 !important;
    }
    
    /* 4. Hide the text cursor in the input field to prevent blinking */
    .react-datepicker__input-container input {
      caret-color: transparent !important;
      cursor: pointer !important;
    }
    
    /* 🛡️ HIDE TIME SELECT ARROW: Remove default dropdown arrow */
    select {
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      background-image: none;
    }
    select::-webkit-calendar-picker-indicator {
      display: none;
    }
    select::-ms-expand {
      display: none;
    }
  `;

  // 🛡️ Fetch dentists for reverse lookup
  useEffect(() => {
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
    fetchDentists();
  }, []);

  // 🛡️ Helper function to get dentist name by email
  const getDentistName = (email) => {
    if (!Array.isArray(dentists) || dentists.length === 0) return email;
    const found = dentists.find(d => d.email === email);
    return found ? `Dr. ${found.name}` : email;
  };

  // 🛡️ Fetch appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('http://127.0.0.1:8000/api/appointments', {
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
    fetchAppointments();
  }, []);

  // 🛡️ UNIFIED HISTORY LOGIC: Grouping all non-active statuses
const historyStatuses = ['completed', 'cancelled', 'no-show', 'declined', 'expired'];

const sortedAppointments = appointments
  .filter(appointment => {
    if (activeTab === 'upcoming') return appointment.status === 'pending' || appointment.status === 'confirmed';
    if (activeTab === 'history') return historyStatuses.includes(appointment.status);
    return false;
  })
  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // 🛡️ Get counts for each tab
  const getCounts = (tab) => appointments.filter(app => {
    if (tab === 'upcoming') return app.status === 'pending' || app.status === 'confirmed';
    if (tab === 'history') return historyStatuses.includes(app.status);
    return false;
  }).length;

  // 🛡️ Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // 🛡️ Open modal with appointment details
  const openModal = (appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  // 🛡️ Guarded Appointment Cancellation
  const handleCancel = async (id) => {
    // 🛡️ REQUIRED REASON WORKFLOW: Prompt for cancellation reason
    const reason = window.prompt(
      "Please provide a reason for cancellation:\n\nThis helps us improve our service and prevent future issues."
    );

    // 🛡️ VALIDATION: Block cancellation if no reason is provided
    if (!reason || reason.trim() === '') {
      alert('Cancellation reason is required. Please provide a reason to continue.');
      return;
    }

    const confirmCancel = window.confirm(
      `Are you sure you want to cancel? \n\nReason: ${reason}`
    );

    if (!confirmCancel) return; // Exit if they click "Cancel"

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://127.0.0.1:8000/api/appointments/${id}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancellation_reason: reason // 🛡️ INCLUDE REASON IN API CALL
        })
      });
      if (response.ok) {
        setAppointments(appointments.map(app => 
          app.id === id ? { ...app, status: 'cancelled' } : app
        ));
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
    }
  };

  // 🛡️ Handle appointment deletion
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this appointment record?')) {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`http://127.0.0.1:8000/api/appointments/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        if (response.ok) {
          setAppointments(appointments.filter(app => app.id !== id));
        }
      } catch (error) {
        console.error("Error deleting appointment:", error);
      }
    }
  };

  // 🛡️ Handle clearing all history appointments
  const handleClearAll = async (tab) => {
    if (!window.confirm(`Are you sure you want to clear all ${tab} appointments?`)) return;
    
    const filteredAppointments = appointments.filter(app => {
      if (tab === 'history') return historyStatuses.includes(app.status);
      return false;
    });

    const token = localStorage.getItem('auth_token');
    try {
      const deletePromises = filteredAppointments.map(appointment => 
        fetch(`http://127.0.0.1:8000/api/appointments/${appointment.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        })
      );
      await Promise.all(deletePromises);
      setAppointments(appointments.filter(app => !historyStatuses.includes(app.status)));
    } catch (error) {
      console.error("Error clearing appointments:", error);
    }
  };

  // 🛡️ Reschedule states and functions
  const startReschedule = (appointment) => {
    setEditingId(appointment.id);
    setNewDate(appointment.appointment_date);
    setNewTime(appointment.preferred_time);
  };

  const handleReschedule = async (id) => {
    const confirmReschedule = window.confirm(
      "Confirm rescheduling your appointment? \n\nPlease ensure this new time works for you to avoid further schedule conflicts."
    );

    if (!confirmReschedule) return; // Exit if they click "Cancel"

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://127.0.0.1:8000/api/appointments/${id}/reschedule`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointment_date: newDate,
          preferred_time: newTime,
        })
      });
      if (response.ok) {
        setAppointments(appointments.map(app => 
          app.id === id 
            ? { ...app, appointment_date: newDate, preferred_time: newTime }
            : app
        ));
        setEditingId(null);
      }
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
    }
  };

  return (
    <>
      <style>{datePickerStyles}</style>
      <div className="max-w-6xl mx-auto p-4 md:p-8 text-black text-left">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold">My Appointments</h1>
            <p className="text-gray-500 text-sm font-medium">View and manage your dental appointments</p>
          </div>
          <Link to="/appointment">
            <button className="!bg-black !text-white px-5 py-2 h-fit rounded-lg font-bold flex items-center gap-2 hover:opacity-80 transition shadow-sm text-sm border-none cursor-pointer">
              <CalendarIcon size={16} /> Book New Appointment
            </button>
          </Link>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="!bg-gray-200 p-1.5 rounded-full flex gap-1">
            {['upcoming', 'history'].map((tab) => (
              <button 
                key={tab} 
                onClick={() => handleTabChange(tab)} 
                className={`
                  px-6 py-2 text-[11px] font-bold uppercase tracking-wider transition-all rounded-full
                  ${activeTab === tab 
                    ? 'bg-[#5b9bd5] text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                {tab === 'history' ? 'History Log' : tab} ({getCounts(tab)})
              </button>
            ))}
          </div>

          {/* 🛡️ UNIFIED CLEAR ALL: Targets all history items at once */}
          {activeTab === 'history' && sortedAppointments.length > 0 && (
            <button 
              onClick={() => handleClearAll('history')}
              className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-all shadow-sm flex items-center gap-2 border-none cursor-pointer"
            >
              <Trash2 size={14} /> {/* 🗑️ Visual Update */}
              Clear All History
            </button>
          )}
        </div>

        {/* 🛡️ THE CONTAINER: Line 347 (approx) */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-20 text-gray-400 font-bold italic">Loading your schedule...</div>
          ) : sortedAppointments.length > 0 ? (
            <>
              {/* 🛡️ THE MAPPING BLOCK */}
{sortedAppointments.slice(0, visibleCount).map((appointment) => (
  <div key={appointment.id} className="bg-white p-8 rounded-[30px] border border-gray-200 shadow-sm animate-fade-in-up">
    <div className="flex justify-between items-start w-full gap-8 px-2">
      
      {/* 🛡️ LEFT COLUMN: Now using flex-col and justify-between to push button to bottom */}
      <div className="flex-1 min-w-0 max-w-[60%] text-left flex flex-col justify-between min-h-[140px]">
        <div>
          <h3 className="text-xl font-bold text-black truncate block mb-1">
            {appointment.service_type === 'Other' 
              ? `Other (${appointment.custom_service || 'No details'})` 
              : appointment.service_type}
          </h3>
          <p className="text-gray-600 capitalize font-medium text-sm mb-4">
            With {getDentistName(appointment.preferred_dentist)}
          </p>

          {editingId === appointment.id ? (
            // 🛠️ RESCHEDULE FORM SECTION
            <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 w-fit">
              <div className="flex items-center gap-2 text-[10px] font-bold text-[#5b9bd5] uppercase mb-1.5">
                <CalendarIcon size={12} /> Select New Date
              </div>
              <DatePicker
                // 🛡️ THE FIX: Strictly bind to current state and parse as a Date object
                selected={newDate ? new Date(newDate) : null} 
                // 🛡️ CALL THE NEW SYNC FUNCTION HERE
                onChange={handleRescheduleDateChange}
                filterDate={(date) => date.getDay() !== 0} // Still blocks Sundays
                minDate={tomorrow} // 🛡️ RE-ENABLED: No same-day bookings
                maxDate={sixMonthsFromNow} // 🛡️ RE-ENABLED: 6-month limit
                className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white outline-none cursor-pointer"
                onFocus={(e) => e.target.blur()} // Prevents mobile keyboard popup
                dateFormat="MM/dd/yyyy" // Matches your preferred visual format
              />
              <div className="flex items-center gap-2 text-[10px] font-bold text-[#5b9bd5] uppercase mb-1.5">
                <Clock size={12} /> Select New Time
              </div>
              {/* 🛡️ NEW: Reschedule Dropdown with Immutable Identity Anchor */}
              <select 
                value={newTime} 
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white outline-none cursor-pointer"
                required
              >
                <option value="">Select time</option>
                {["07:00 AM", "09:00 AM", "11:00 AM", "01:00 PM", "03:00 PM", "05:00 PM"].map(time => {
                  // 🛡️ 1. CONFLICT CHECK: Is this taken by ANOTHER patient?
                  const isTaken = takenSlots.includes(time.toUpperCase());
                  
                  // 🛡️ 2. LOCAL-SAFE IDENTITY ANCHOR: The final visual fix
                  // We extract YYYY-MM-DD manually to avoid the ISO/UTC "Day Rollback" bug
                  const getLocalDateString = (dateObj) => {
                    if (!dateObj) return '';
                    const d = new Date(dateObj);
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                  };

                  const cleanNewDate = getLocalDateString(newDate);
                  const cleanHomeDate = getLocalDateString(appointment.appointment_date);
                  
                  const isCurrentTimeOnOriginalDate = 
                    cleanNewDate === cleanHomeDate && 
                    time.toUpperCase() === appointment.preferred_time.toUpperCase(); 
                  
                  return (
                    <option 
                      key={time} 
                      value={time} 
                      disabled={isTaken || isCurrentTimeOnOriginalDate}
                    >
                      {time} 
                      {/* 🛡️ Label now reappears because it's immune to Timezone shifts & state clearing */}
                      {isTaken ? " — (Booked)" : isCurrentTimeOnOriginalDate ? " — (Current Time)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          ) : (
            /* 🛡️ STANDARD SCHEDULE DISPLAY */
            <div className="flex items-center gap-6 text-gray-600 text-sm font-medium">
              <div className="flex items-center gap-2">
                <CalendarIcon size={16} />
                {new Date(appointment.appointment_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} />
                {appointment.preferred_time}
              </div>
            </div>
          )}
        </div>

        {/* ✅ ENCIRCLED AREA: View Details at the very bottom-left */}
        {editingId !== appointment.id && (
          <button 
            onClick={() => openModal(appointment)}
            className="mt-6 w-fit px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all flex items-center gap-2 border bg-white text-[#5b9bd5] border-[#5b9bd5] hover:bg-blue-50 cursor-pointer shadow-sm border-none"
          >
            <ChevronDown size={14} />
            View Details
          </button>
        )}
      </div>

      {/* 🛡️ RIGHT COLUMN: Status & Metadata */}
      <div className="flex flex-col items-end gap-3 w-[35%] shrink-0">
        {/* Status Badge */}
        <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase ${
          appointment.status === 'completed' ? 'bg-green-50 text-green-600' : 
          appointment.status === 'expired' ? 'bg-black text-white' : // 🎯 THE BLACKOUT
          ['cancelled', 'no-show', 'declined'].includes(appointment.status) ? 'bg-red-50 text-red-600' : 
          'bg-blue-50 text-[#5b9bd5]'
        }`}>
          {appointment.status === 'no-show' ? 'No-Show' : appointment.status}
        </span>

        <div className="flex flex-col items-end gap-1">
          {/* Always show Booked On */}
          <span className="text-[10px] text-gray-400 font-bold italic">
            Booked on: {new Date(appointment.created_at).toLocaleString('en-US', { 
              month: 'short', day: 'numeric', year: 'numeric', 
              hour: 'numeric', minute: '2-digit', hour12: true 
            })}
          </span>

          {/* 🛡️ THE FIX: Syncing the background cards */}
          {historyStatuses.includes(appointment.status) && (
            <span className="text-[10px] text-gray-400 font-bold italic">
              {appointment.status === 'cancelled' ? 'Cancelled on: ' : 
               appointment.status === 'completed' ? 'Completed on: ' : 
               appointment.status === 'declined' ? 'Declined on: ' : 'No-Show on: '}
              
              {(() => {
                const date = new Date(appointment.updated_at);
                return isNaN(date.getTime()) 
                  ? 'Processing...' 
                  : date.toLocaleString('en-US', { 
                      month: 'short', day: 'numeric', year: 'numeric', 
                      hour: 'numeric', minute: '2-digit', hour12: true 
                    });
              })()}
            </span>
          )}
        </div>

        {/* 🛡️ ACTION BUTTONS: Pending/Confirmed Logic Shift */}
        {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
          <div className="flex flex-col items-end gap-3 mt-2 w-full">
            {editingId === appointment.id ? (
              <>
                <button 
                  onClick={() => handleReschedule(appointment.id)} 
                  className="min-w-[145px] px-4 py-2.5 bg-green-500 text-white rounded-md text-xs font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-3 cursor-pointer border-none shadow-sm"
                >
                  <Save size={16}/> Save
                </button>
                <button 
                  onClick={() => setEditingId(null)} 
                  className="min-w-[145px] px-4 py-2.5 bg-gray-100 text-gray-700 rounded-md text-xs font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-3 cursor-pointer border-none shadow-sm"
                >
                  <X size={16}/> Return
                </button>
              </>
            ) : (
              <>
                {/* 🛡️ THE FIX: Only show Reschedule if the status is PENDING */}
                {appointment.status === 'pending' && (
                  <button 
                    onClick={() => startReschedule(appointment)} 
                    className="min-w-[145px] px-4 py-2.5 bg-[#5b9bd5] text-white rounded-md text-xs font-bold hover:bg-[#4a8ac4] transition-all flex items-center justify-center gap-3 cursor-pointer border-none shadow-sm"
                  >
                    <CalendarIcon size={16} /> 
                    <span>Reschedule</span>
                  </button>
                )}
                
                {/* Cancel remains available for both Pending and Confirmed */}
                <button 
                  onClick={() => handleCancel(appointment.id)} 
                  className="min-w-[145px] px-4 py-2.5 bg-white text-gray-600 border border-gray-200 rounded-md text-xs font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-3 cursor-pointer shadow-sm"
                >
                  <X size={16} /> 
                  <span>Cancel</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* 🛡️ THE FIX: Allow deletion and status visibility for 'declined' and 'expired' */}
        {(appointment.status === 'completed' || 
          appointment.status === 'cancelled' || 
          appointment.status === 'declined' || 
          appointment.status === 'no-show' ||
          appointment.status === 'expired') && (
          <div className="flex flex-col items-end gap-2">
            {/* If it was declined, we show a small indicator that there is a reason to view */}
            
            
            <button 
              onClick={() => handleDelete(appointment.id)}
              className="px-6 py-2 h-10 bg-white border border-gray-200 rounded-md text-xs font-bold text-red-400 hover:bg-red-50 hover:border-red-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm whitespace-nowrap"
            >
              Delete Record
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
))} {/* 🛡️ CRITICAL: Properly closes the .map() loop */} {/* 👈 CRITICAL: This closes the .map() and the curly brace */}

              {/* ➕ "View More History" Button Section */}
              {activeTab === 'history' && sortedAppointments.length > visibleCount && (
                <div className="flex justify-center mt-8 pb-10">
                  <button 
                    onClick={() => setVisibleCount(prev => prev + 16)}
                    className="flex items-center gap-2 px-8 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-blue-50 hover:border-[#5b9bd5] hover:text-[#5b9bd5] transition-all cursor-pointer shadow-sm border-none"
                  >
                    <ChevronDown size={20} />
                    View More History ({sortedAppointments.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-24 bg-white rounded-[30px] border border-gray-200 shadow-sm">
              <p className="text-gray-400 font-bold text-lg italic px-8">No {activeTab} appointments.</p>
            </div>
          )}
        </div> 
        {/* 🛡️ LINE 594 (approx): This closes the space-y-6 div */}

        {/* 🎯 MODAL: Appointment Details */}
        {isModalOpen && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              
              {/* 🎯 MODAL: Appointment Details Header */}
              <div className="p-6 border-b flex justify-between items-start sticky top-0 bg-white">
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-bold text-navy-900">Appointment Details</h2>
                  
                  {/* 🎯 MODAL AUDIT SUB-HEADER: Synchronized with card timestamps */}
                  <div className="flex flex-col text-[11px] font-bold italic text-gray-400">
                    <span>
                      Booked on: {selectedAppointment.created_at ? new Date(selectedAppointment.created_at).toLocaleString('en-US', { 
                        month: 'short', day: 'numeric', year: 'numeric', 
                        hour: 'numeric', minute: '2-digit', hour12: true 
                      }) : 'Processing...'}
                    </span>
                    {historyStatuses.includes(selectedAppointment.status) && (
                      <span className={selectedAppointment.status === 'completed' ? 'text-green-600' : 'text-red-400'}>
                        {selectedAppointment.status === 'cancelled' ? 'Cancelled on: ' : 
                         selectedAppointment.status === 'completed' ? 'Completed on: ' : 
                         selectedAppointment.status === 'declined' ? 'Declined on: ' : 'No-Show on: '}
                        
                        {selectedAppointment.updated_at ? (
                          new Date(selectedAppointment.updated_at).toLocaleString('en-US', { 
                            month: 'short', day: 'numeric', year: 'numeric', 
                            hour: 'numeric', minute: '2-digit', hour12: true 
                          })
                        ) : (
                          'Awaiting Server Sync...'
                        )}
                      </span>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="bg-black hover:bg-gray-800 text-white p-1.5 rounded-full transition-colors flex items-center justify-center shadow-sm border-none cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-8 space-y-6">
                {/* 🎯 UPDATED: Clean Text-Only Identity Section */}
                <section className="bg-gray-50 rounded-xl p-6 border border-gray-100 mb-8">
                  <div className="text-left min-w-0">
                    {/* Full Name - Now more prominent without the image offset */}
                    <h4 className="text-2xl font-bold text-black mb-3 break-all line-clamp-2">
                      {selectedAppointment.full_name}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8">
                      <div className="space-y-2">
                        <p className="flex items-center gap-2 text-sm text-gray-600 break-all">
                          <Mail size={16} className="text-[#5b9bd5] shrink-0" /> 
                          <span className="font-medium">{selectedAppointment.email}</span>
                        </p>
                        <p className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone size={16} className="text-[#5b9bd5] shrink-0" /> 
                          <span className="font-medium">{selectedAppointment.phone}</span>
                        </p>
                      </div>

                      <div className="flex flex-col justify-end">
                        {/* 🛡️ Booked by email - Styled as a secondary meta-info tag */}
                        <p className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1 md:mt-0 md:justify-end">
                          <User size={14} className="text-gray-300 shrink-0" /> 
                          Booked by: <span className="text-gray-500 lowercase ml-1 font-normal italic">{selectedAppointment.user_email || selectedAppointment.email}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 1. Service Type Section */}
                <section className="mb-8">
                  <h3 className="text-xs uppercase text-black font-bold mb-2 tracking-[0.2em]">
                    Service Type
                  </h3>
                  <p className="text-gray-900 leading-relaxed whitespace-pre-wrap break-words text-md">
                    {selectedAppointment.service_type === 'Other' 
                      ? `Other (${selectedAppointment.custom_service || selectedAppointment.customService || 'No details provided'})` 
                      : selectedAppointment.service_type}
                  </p>
                </section>

                {/* 2. Date, Time, Dentist Section */}
                <section className="grid grid-cols-3 gap-8">
                  <section>
                    <h3 className="text-xs uppercase text-black font-bold mb-2 tracking-[0.2em]">
                      Date & Time
                    </h3>
                    {/* 🛡️ UNIFIED DESIGN: Both date and time now share the same bold black style */}
                    <div className="flex flex-col">
                      {/* 🛡️ THE FIX: Replace hardcoded "April 1" with dynamic data */}
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
                  </section>
                  
                  <section>
                    <h3 className="text-xs uppercase text-black font-bold mb-2 tracking-[0.2em]">
                      Dentist
                    </h3>
                    {/* 🛡️ SYNCED STYLE: Matches Dr. Hin D. Sadboi */}
                    <p className="text-base text-black">
                      {getDentistName(selectedAppointment.preferred_dentist)}
                    </p>
                  </section>
                </section>

                {/* 3. Medical Section (Now Borderless) */}
                <section className="pt-8 border-t border-gray-100">
                  <h3 className="text-xs uppercase text-black font-bold mb-4 tracking-[0.2em]">
                    Medical Conditions & Notes
                  </h3>
                  
                  <div className="text-gray-900 leading-relaxed whitespace-pre-wrap break-words text-sm">
                     {/* Medical Conditions List */}
                     <p className="mb-6">
                       {selectedAppointment.medical_conditions && selectedAppointment.medical_conditions.length > 0 
                         ? selectedAppointment.medical_conditions.join(', ') 
                         : 'No medical conditions listed.'}
                     </p>
                     
                     {/* Others Section */}
                     <div className="space-y-1">
                       <span className="text-xs uppercase text-black font-bold tracking-[0.2em]">
                         Additional Notes
                       </span>
                       <p className="text-gray-700 pt-1">
                         {selectedAppointment.others || 'None'}
                       </p>
                     </div>
                  </div>
                </section>

              {/* 🛡️ PATIENT AUDIT: Show reason they provided during cancellation */}
              {/* 🛡️ PATIENT/ADMIN AUDIT: Show reason for any unsuccessful appointment */}
              {['cancelled', 'declined', 'no-show'].includes(selectedAppointment.status) && (
                <section className="pt-6 border-t border-gray-100 mt-4">
                  <h3 className="text-xs uppercase text-red-600 font-bold mb-3 tracking-[0.2em]">
                    {selectedAppointment.status === 'cancelled' ? 'Your Cancellation Reason' : 
                     selectedAppointment.status === 'declined' ? 'Clinic Decline Reason' : 
                     'No-Show Reason'}
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-300">
                    <p className="text-gray-700 italic text-sm">
                      "{selectedAppointment.cancellation_reason || 'No specific reason provided.'}"
                    </p>
                  </div>
                </section>
              )}
              {/* 🎯 MODAL AUDIT: Monochrome Expired Styling */}
              {selectedAppointment.status === 'expired' && (
                <section className="pt-6 border-t border-gray-900 bg-gray-50 p-4 rounded-xl mt-4">
                  <div className="flex items-center gap-2 mb-2 text-black font-black uppercase text-[10px] tracking-widest">
                        <Clock size={14} /> 
                        System Expiration Note
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
      </div>
    </>
  );
}
