import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../api';

export default function AppointmentSummaryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const formData = location.state?.formData;
  const [isLoading, setIsLoading] = useState(false);
  const [dentists, setDentists] = useState([]); // Fetch dentists for reverse lookup

  // Handle Edit - Send data back to form page
  const handleEdit = () => {
    // We send the current formData back to the form page
    navigate('/appointment', { state: { formData } }); 
  };

  if (!formData) {
    return <div className="p-8 text-center text-gray-600 font-medium">No appointment details found.</div>;
  }

  // --- FETCH DENTISTS FOR REVERSE LOOKUP ---
  useEffect(() => {
    const fetchDentists = async () => {
      try {
        const response = await fetch(`${API_URL}/api/dentists`, {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Accept': 'application/json'
          }
        });
        const data = await response.json();
        if (response.ok) {
          setDentists(data.dentists || []);
        }
      } catch (err) {
        console.error("Failed to fetch dentists:", err);
      }
    };

    fetchDentists();
  }, []);

  // 🛡️ REVERSE LOOKUP: Find name that belongs to stored email
  const displayDentistName = dentists.find(d => d.email === formData.preferredDentist)?.name 
                             || "Not Selected";

  const handleConfirm = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('auth_token');

    // 🛡️ DATA SANITIZATION: Ensure types match Laravel Validation
    const payload = {
      full_name: formData.fullName,
      phone: formData.phone, // Must be 11 digits to pass backend
      email: formData.email, // Must be valid email format
      service_type: formData.serviceType, // Will be "Other"
      
      // ✅ NEW CORRECTED LINE: Keep medical notes strictly as medical notes
      others: formData.others, // Only medical condition notes
      
      preferred_dentist: formData.preferredDentist,
      // Ensure medical_conditions is always an array to avoid 422
      medical_conditions: Array.isArray(formData.medicalConditions) ? formData.medicalConditions : [],
      appointment_date: formData.appointmentDate,
      preferred_time: formData.preferredTime,
      // 🛡️ THE CRITICAL FIX: Explicitly map custom_service field
      custom_service: formData.customService
    };

    try {
      const response = await fetch(`${API_URL}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`, 
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.status === 401) {
        alert("Session expired. Please log in again.");
        localStorage.removeItem('auth_token');
        navigate('/login');
      } else if (response.ok) {
        alert("Appointment booked successfully!");
        navigate('/my-appointments');
      } else if (response.status === 422) {
        // 🛡️ THE FEEDBACK SYNC: Catching 11-digit or Email errors
        const errorMessages = Object.values(data.errors).flat().join('\n');
        alert(`Validation Errors:\n${errorMessages}`);
      } else {
        alert(`Booking Error: ${data.message || 'Something went wrong.'}`);
      }
    } catch (error) {
      alert("Connection failed. Is XAMPP running?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 text-black text-left">
      <h1 className="text-xl font-bold mb-1 text-gray-800">Appointment Summary</h1>
      <p className="text-sm text-gray-500 mb-6 font-medium">Review the details of your dental appointment before confirming your schedule.</p>
      
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 space-y-8">
        <div className="flex items-center gap-2 font-bold text-lg border-b pb-2 text-gray-800">
           <img src="/images/calendar.png" alt="" className="w-5 h-5 opacity-70" />
           Appointment Details
        </div>

        {/* 1. Personal Information */}
        <section className="mb-8 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4 text-gray-800 text-left">Personal Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-400">Name:</label>
              <p className="text-gray-900 font-medium break-words whitespace-pre-wrap">
                {formData.fullName}
              </p>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-400">Phone:</label>
              <p className="text-gray-900 font-medium break-words whitespace-pre-wrap">
                {formData.phone}
              </p>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-400">Email:</label>
              <p className="text-gray-900 font-medium break-words whitespace-pre-wrap">
                {formData.email}
              </p>
            </div>
          </div>
        </section>

        <hr className="border-gray-200" />

        {/* 2. Appointment Info */}
        <section className="mb-8 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4 text-gray-800 text-left">Appointment Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-400">Service:</label>
              <p className="text-gray-900 font-medium">
                {formData.serviceType}
              </p>
              {formData.serviceType === 'Other' && (
                <p className="text-gray-700 italic mt-1 break-words whitespace-pre-wrap">
                  ({formData.customService})
                </p>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-[10px] font-bold uppercase text-gray-400">Dentist:</label>
              <p className="text-gray-900 font-medium break-words whitespace-pre-wrap">
                {displayDentistName !== "Not Selected" ? `Dr. ${displayDentistName}` : displayDentistName}
              </p>
            </div>
          </div>
        </section>

        <hr className="border-gray-300" />

        {/* 3. Medical Conditions */}
        <section>
          <h2 className="text-xl font-bold mb-3">Medical Condition</h2>
          <div className="space-y-2 text-[15px] font-medium">
            {formData.medicalConditions.map((condition, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-[#5b9bd5] text-lg">•</span>
                <p className="text-sm text-black italic">{condition}</p>
              </div>
            ))}
            
            {/* 🛡️ GUARD: Only apply 'others' notes to Medical Condition section */}
            {formData.medicalConditions.includes("Others (please specify)") && (
              <div className="mt-2 ml-4">
                <p className="text-gray-400 text-[10px] font-bold uppercase">Others:</p>
                <p className="text-sm text-black italic break-words">
                  {formData.others}
                </p>
              </div>
            )}
          </div>
        </section>

        <hr className="border-gray-300" />

        {/* 4. Schedule */}
        <section>
          <h2 className="text-xl font-bold mb-3">Select Schedule</h2>
          <div className="space-y-2 text-[15px] font-medium">
            <p><span className="text-gray-500">Date:</span> {new Date(formData.appointmentDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <p><span className="text-gray-500">Time:</span> {formData.preferredTime}</p>
          </div>
        </section>

        <div className="flex gap-4 pt-4">
          <button 
            onClick={handleEdit} 
            className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition shadow-sm border border-gray-200"
          >
            Edit Details
          </button>
          <button 
            onClick={handleConfirm} 
            disabled={isLoading}
            className="flex-1 py-3.5 bg-[#5b9bd5] text-white font-bold rounded-lg hover:bg-[#4a8ac4] transition shadow-md disabled:bg-gray-400"
          >
            {isLoading ? "Processing..." : "Confirm Appointment"}
          </button>
        </div>
      </div>
    </div>
  );
}