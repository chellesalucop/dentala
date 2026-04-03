import React, { useState, useEffect, useRef } from 'react';
import { Search, MoreVertical, Mail, Phone, Calendar, User as UserIcon, X, Clock, FileText, AlertCircle } from 'lucide-react';
import { API_URL, getProfilePhotoUrl } from '../api';

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [openActionId, setOpenActionId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(20); // Initial limit set to 20

  const actionMenuRef = useRef(null);

  useEffect(() => {
    fetchPatients();
    const handleClickOutside = (e) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) {
        setOpenActionId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/api/admin/patients-list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async (patient) => {
    setLoadingHistory(true);
    setSelectedPatient(patient);
    setOpenActionId(null);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/api/admin/appointments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });
      if (response.ok) {
        const allAppointments = await response.json();
        
        // REFINED FILTER: Strict name matching to separate family members on one account
        const history = allAppointments.filter(app => 
            app.full_name.toLowerCase() === patient.username.toLowerCase() &&
            app.email === patient.email
        );
        
        setPatientHistory(history);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="text-left text-black relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Patients</h1>
          <p className="text-gray-600 font-medium">Manage clinical records for accounts and dependents</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5b9bd5] transition-all"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-gray-500">Patient</th>
                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-gray-500">Contact Details</th>
                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-gray-500 text-center">Total Visits</th>
                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-gray-500 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-400 italic">Syncing clinical records...</td></tr>
              ) : filteredPatients.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-500 font-medium">No records found.</td></tr>
              ) : (
                filteredPatients.slice(0, visibleCount).map((patient, index) => (
                  <tr key={`${patient.id}-${index}`} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 text-left max-w-[250px]">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
                          {patient.profile_photo_path ? (
                            <img 
                              src={getProfilePhotoUrl(patient.profile_photo_path)} 
                              alt="" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserIcon size={20} className="text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-lg text-gray-900 truncate" title={patient.username}>
                            {patient.username}
                          </h3>
                          <p className="text-[10px] text-gray-400 font-bold truncate">
                            {patient.is_guest ? 'Guest/Dependent' : 'Registered Account'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-600 max-w-[200px]">
                      <div className="flex items-center gap-2 truncate" title={patient.email}>
                        <Mail size={14} className="text-[#5b9bd5] shrink-0" /> 
                        <span className="truncate">{patient.email}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone size={14} className="text-[#5b9bd5] shrink-0" /> 
                        {patient.phone || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-[#5b9bd5] rounded-full text-xs font-bold border border-blue-100">
                        <Calendar size={12} /> {patient.appointments_count} {patient.appointments_count === 1 ? 'visit' : 'visits'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <button 
                        onClick={() => setOpenActionId(openActionId === patient.id ? null : patient.id)}
                        className="p-2 text-gray-400 hover:text-black hover:bg-gray-200 rounded-full transition bg-transparent border-none cursor-pointer"
                      >
                        <MoreVertical size={20} />
                      </button>
                      
                      {openActionId === patient.id && (
                        <div ref={actionMenuRef} className="absolute right-6 top-12 w-44 bg-white border border-gray-200 rounded-lg shadow-xl z-30 py-1">
                          <button 
                            onClick={() => fetchHistory(patient)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-none bg-transparent cursor-pointer font-semibold flex items-center gap-2"
                          >
                            <FileText size={16} /> View History
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View More Pagination Button */}
      {filteredPatients.length > visibleCount && (
        <div className="flex justify-center py-8 bg-white border-t border-gray-100">
          <button 
            onClick={() => setVisibleCount(prev => prev + 20)}
            className="flex items-center gap-2 px-8 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 hover:border-[#5b9bd5] hover:text-[#5b9bd5] transition-all cursor-pointer shadow-sm"
          >
            <Clock size={18} />
            View More Patients ({filteredPatients.length - visibleCount} remaining)
          </button>
        </div>
      )}

      {/* MODAL: PATIENT HISTORY */}
      {selectedPatient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <div className="flex items-center gap-4 min-w-0 flex-1"> 
                <div className="w-12 h-12 rounded-full overflow-hidden bg-white border border-gray-200 flex items-center justify-center shrink-0">
                   {selectedPatient.profile_photo_path ? <img src={getProfilePhotoUrl(selectedPatient.profile_photo_path)} className="w-full h-full object-cover" /> : <UserIcon className="w-full h-full p-2 text-gray-300" />}
                </div>
                <div className="text-left min-w-0 flex-1">
                  {/* 🛡️ THE FIX: Removed truncate, added break-all for vertical expansion */}
                  <h2 className="text-xl font-bold text-gray-900 break-all leading-tight">
                    {selectedPatient.username}
                  </h2>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{selectedPatient.is_guest ? 'Family Dependent Log' : 'Account History'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="p-2 hover:bg-gray-200 rounded-full transition border-none bg-transparent cursor-pointer shrink-0">
                <X size={20} />
              </button>
            </div>
            {/* 🛡️ THE SCROLLABLE BODY: Forces vertical flow only */}
            <div className="p-6 overflow-y-auto flex-grow bg-white text-left custom-scrollbar">
              {loadingHistory ? <div className="text-center py-20 text-gray-400 italic">Syncing clinical history...</div> : patientHistory.length === 0 ? <div className="text-center py-20 text-gray-500 font-medium">No dental history found for this patient name.</div> : (
                <div>
                  {patientHistory.map((entry, idx) => (
                    <div key={idx} className="mb-10 last:mb-0 border-b border-gray-50 pb-8 last:border-0">
                      
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <time className="text-sm font-bold text-dentalBlue flex items-center gap-1.5">
                          <Calendar size={14} />
                          {new Date(entry.appointment_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </time>
                        <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full shrink-0 ${entry.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{entry.status}</span>
                      </div>
                      
                      {/* Service Title: No more horizontal stretching */}
                      <h4 className="text-lg font-bold text-gray-900 break-all whitespace-pre-wrap leading-tight mb-2">
                        {entry.service_type === 'Other' 
                          ? `Other (${entry.custom_service || entry.customService || 'No details'})` 
                          : entry.service_type}
                      </h4>
                      
                      <div className="text-sm text-gray-500 font-medium mb-3">
                        Visit at {entry.preferred_time} • Dentist: {entry.preferred_dentist}
                      </div>

                      {entry.medical_conditions && entry.medical_conditions.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-200">
                          <span className="text-xs uppercase text-blue-700 font-bold tracking-wider">Medical Conditions</span>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {entry.medical_conditions.map((condition, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                {condition}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 🛡️ CLINICAL NOTES: Forced vertical wrap barrier */}
                      {entry.others && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-xl border-l-4 border-gray-200">
                          <span className="text-[10px] uppercase text-gray-500 font-black tracking-widest block mb-1">Clinical Notes</span>
                          <p className="text-sm text-gray-700 break-all whitespace-pre-wrap leading-relaxed">
                            {entry.others}
                          </p>
                        </div>
                      )}

                      {/* 🛡️ REASONS (Cancellation/Decline/No-Show): Vertical Flow Fix */}
                      {['cancelled', 'declined', 'no-show'].includes(entry.status) && (
                        <div className="mt-4 p-4 bg-red-50 rounded-xl border-l-4 border-red-200">
                          <span className="text-[10px] uppercase text-red-600 font-black tracking-widest block mb-1">
                            {entry.status === 'cancelled' ? 'Cancellation Reason' : entry.status === 'declined' ? 'Decline Reason' : 'No-Show Note'}
                          </span>
                          <p className="text-sm text-gray-800 italic break-all whitespace-pre-wrap">
                            "{entry.cancellation_reason || 'No details provided.'}"
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-right"><button onClick={() => setSelectedPatient(null)} className="px-6 py-2 bg-white border border-gray-300 rounded-lg font-bold text-gray-700 cursor-pointer hover:bg-gray-100 transition shadow-sm border-none">Close Records</button></div>
          </div>
        </div>
      )}
    </div>
  );
}