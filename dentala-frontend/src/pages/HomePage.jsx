import React, { useState, useEffect } from 'react';
import { API_URL, getProfilePhotoUrl } from '../api';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Clock, User as UserIcon, X } from 'lucide-react';

export default function HomePage() {
  const [expandedService, setExpandedService] = useState(1);
  const [activeAppointments, setActiveAppointments] = useState([]); //
  const [dentists, setDentists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const servicesData = [
    { id: 1, title: 'Prophylaxis', desc: 'General Tooth Cleaning', price: '₱ 650.00' },
    { id: 2, title: 'Orthodontics', desc: 'Braces and Aligners', price: '₱ 5,000.00+' },
    { id: 3, title: 'Whitening', desc: 'Laser Teeth Whitening', price: '₱ 2,500.00' },
    { id: 4, title: 'Dentures', desc: 'Full and Partial Dentures', price: '₱ 4,000.00+' },
    { id: 5, title: 'Extraction', desc: 'Safe Tooth Removal', price: '₱ 800.00' },
  ];

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        };

        // Fetch both Appointments and Registered Dentists simultaneously
        const [appRes, dentistRes] = await Promise.all([
          fetch(`${API_URL}/api/appointments`, { headers }),
          fetch(`${API_URL}/api/dentists`, { headers })
        ]);

        if (appRes.ok) {
          const appData = await appRes.json();
          // THE PRIORITY SORT: Upcoming first, then by Closest Date
          const prioritized = appData
            .filter(app => app.status === 'pending' || app.status === 'confirmed')
            .sort((a, b) => {
              // 1. Prioritize Status (Confirmed/Upcoming stays at the top)
              if (a.status === 'confirmed' && b.status !== 'confirmed') return -1;
              if (a.status !== 'confirmed' && b.status === 'confirmed') return 1;

              // 2. If statuses are equal, sort by Date (Closest to present first)
              // This compares "2026-03-30" vs "2026-04-01"
              return new Date(a.appointment_date) - new Date(b.appointment_date);
            });

          setActiveAppointments(prioritized); //
        }

        if (dentistRes.ok) {
          const dentistData = await dentistRes.json();
          // CRITICAL FIX: Extract the dentists array from the object
          // If your backend returns { "dentists": [...] }, use dentistData.dentists
          setDentists(dentistData.dentists || []); 
        }

      } catch (error) {
        console.error("Error fetching homepage data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const handleServiceClick = (id) => {
    setExpandedService(expandedService === id ? null : id);
  };

  const openModal = (appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  // REVERSE LOOKUP: Find name that belongs to stored email
  const getDentistName = (email) => {
    if (!Array.isArray(dentists) || dentists.length === 0) return email;
    
    const found = dentists.find(d => d.email === email);
    return found ? `Dr. ${found.name}` : email; 
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="h-64 rounded-lg relative overflow-hidden flex items-center px-12 shadow-md">
        <img src="/images/banner.png" alt="Smile Champion" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="z-10 text-white text-left">
          <h1 className="text-4xl font-bold mb-2">We help you smile like a champion.</h1>
          <p className="mb-4">Avail our services</p>
          <Link to="/appointment" className="bg-[#5b9bd5] text-white font-semibold py-2 px-6 rounded hover:bg-blue-500 transition inline-block no-underline">Book Now</Link>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-transparent opacity-60"></div>
      </div>

      {/* Dynamic My Appointments Widget */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">My Appointments</h2>
          <Link 
            to="/my-appointments" 
            className="flex items-center justify-center w-12 h-8 rounded-full text-gray-400 bg-transparent transition-all duration-300 ease-in-out hover:!bg-[#5b9bd5] hover:!text-white no-underline outline-none border-none"
            title="See All"
          >
            <ArrowRight size={20} />
          </Link>
        </div>

        {/* 🛡️ DASHBOARD SYNC: Status Badges and View Details Integration */}
        {isLoading ? (
          <div className="bg-white p-6 rounded-xl border border-gray-200 animate-pulse text-gray-400 font-medium text-left">
            Checking your schedule...
          </div>
        ) : activeAppointments.length > 0 ? (
          <div className="space-y-4"> 
            {activeAppointments.map((appointment) => (
              <div key={appointment.id} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-2 text-left relative overflow-hidden group transition-all hover:shadow-md">
        
        {/* 🛡️ No color accent line here - Border is clean as requested */}
        
        <div className="flex justify-between items-start">
          {/* 🛡️ THE FIX: max-w-[70%] ensures text never touches status badge */}
          <div className="flex flex-col flex-1 min-w-0 max-w-[70%]"> 
            <h3 className="font-bold text-lg text-gray-900 truncate" title={appointment.service_type}>
              {appointment.service_type === 'Other' 
                ? `Other (${appointment.custom_service || 'No details'})` 
                : appointment.service_type}
            </h3>
            <p className="text-sm text-gray-500 font-medium truncate">
              with {getDentistName(appointment.preferred_dentist)}
            </p>
          </div>
          
          {/* Status Badge - remains anchored to right */}
          <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider shrink-0 ${
            appointment.status === 'confirmed' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-blue-50 text-blue-600'    
          }`}>
            {appointment.status}
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
          <div className="flex gap-5 text-sm text-gray-600 font-medium">
            <span className="flex items-center gap-1.5">
              <Calendar size={16} className="text-[#5b9bd5]" /> 
              {new Date(appointment.appointment_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={16} className="text-[#5b9bd5]" /> 
              {appointment.preferred_time}
            </span>
          </div>

          {/* 🛡️ VIEW DETAILS: Arrow icon removed for cleaner design */}
          <button 
            onClick={() => openModal(appointment)}
            className="text-[11px] font-bold uppercase tracking-widest text-[#5b9bd5] hover:text-blue-700 transition-colors no-underline bg-transparent border-none cursor-pointer p-0"
          >
            View Details
          </button>
        </div>
      </div>
    ))}
  </div>
) : (
  <div className="bg-white p-8 rounded-xl border border-dashed border-gray-300 text-center">
    <p className="text-gray-500 text-sm mb-3 font-medium">You have no upcoming appointments.</p>
    <Link to="/appointment" className="text-[#5b9bd5] font-bold text-sm hover:underline no-underline">Schedule one now</Link>
  </div>
)}

      </section>

      {/* What We Offer */}
      <section>
        <h2 className="text-xl font-bold mb-4">What We Offer</h2>
        <div className="flex gap-4 items-center overflow-x-auto pb-4 custom-scrollbar">
          {servicesData.map((service) => {
            const isExpanded = expandedService === service.id;
            return (
              <div
                key={service.id}
                onClick={() => handleServiceClick(service.id)}
                className={`bg-white border border-gray-200 shadow-sm cursor-pointer transition-all duration-300 flex flex-col overflow-hidden select-none
                  ${isExpanded ? 'p-4 rounded-lg min-w-[200px]' : 'py-3 px-4 rounded-md min-w-[160px] justify-center hover:bg-gray-50'}
                `}
              >
                <div className={`flex items-center gap-2 font-bold ${isExpanded ? 'mb-2' : ''}`}>
                  <span className="text-[10px] text-gray-400">{isExpanded ? '▼' : '▶'}</span>
                  <h3 className="text-[15px]">{service.title}</h3>
                </div>

                {isExpanded && (
                  <div className="mt-1 animate-fade-in text-left">
                    <p className="text-[13px] text-gray-500 mb-6 leading-tight">{service.desc}</p>
                    <p className="font-bold text-sm text-gray-800">{service.price}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button className="flex items-center justify-center w-12 h-8 rounded-full text-gray-400 bg-transparent transition-all duration-300 ease-in-out hover:!bg-[#5b9bd5] hover:!text-white no-underline outline-none border-none cursor-pointer">
          <ArrowRight size={20} />
        </button>
      </section>

      {/* UPDATED: Featured Dentists (Registered only) */}
      <section>
        <h2 className="text-xl font-bold mb-4">Our Registered Dentists</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {dentists.length > 0 ? (
            dentists.map((dentist) => (
              <div key={dentist.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-center hover:shadow-md transition-shadow cursor-pointer">
                <div className="h-48 bg-gray-50 flex items-end justify-center pt-4">
                  {dentist.profile_photo_path ? (
                    <img 
                      src={getProfilePhotoUrl(dentist.profile_photo_path)} 
                      alt={dentist.name} 
                      className="w-32 h-40 rounded-t-full object-contain" 
                    />
                  ) : (
                    <img 
                      src="/images/dentist.png" 
                      alt={dentist.name} 
                      className="w-32 h-40 rounded-t-full object-contain" 
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold mb-1">Dr. {dentist.name}</h3>
                  <p className="text-sm text-gray-500 font-medium">
                    {dentist.specialization || 'General Dentistry'}
                  </p>
                </div>

              </div>
            ))
          ) : (
            <div className="col-span-3 py-10 text-gray-400 italic">
              {isLoading ? "Loading dentists..." : "No registered dentists found."}
            </div>
          )}
        </div>
      </section>

      {/* MODAL: Appointment Details (Dashboard View) */}
      {isModalOpen && selectedAppointment && (
        <div 
          /* 🛡️ THE FULL-WINDOW FORCE: fixed with inset-0 and z-[9999] */
          className="fixed inset-0 w-full h-full z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" 
          onClick={() => setIsModalOpen(false)}
          /* 🛡️ CRITICAL: Inline styles to override any lingering CSS centering from index.css or App.css */
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh',
            margin: 0 
          }}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in-up" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Sticky at the top of the 90vh box */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-start sticky top-0 bg-white z-10">
              <div className="flex flex-col gap-1 min-w-0">
                <h2 className="text-2xl font-bold text-gray-900">Appointment Details</h2>
                <span className="text-[11px] font-bold text-gray-400 italic">
                  Booked on: {new Date(selectedAppointment.created_at).toLocaleString('en-US', { 
                    month: 'short', day: 'numeric', year: 'numeric', 
                    hour: 'numeric', minute: '2-digit', hour12: true 
                  })}
                </span>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="bg-black hover:bg-gray-800 text-white p-1.5 rounded-full transition-colors flex items-center justify-center border-none cursor-pointer shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* 🛡️ SCROLLABLE BODY: Forces long text (PPPP... / VVVV...) to wrap vertically */}
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 text-left space-y-8">
              
              {/* Service Requested Section */}
              <section>
                <h3 className="text-xs uppercase text-black font-bold mb-2 tracking-[0.2em]">Service Requested</h3>
                {/* 🛡️ CLAMP FIX: Shows up to 3 lines before adding (...) */}
                <p className="text-gray-900 font-medium break-all whitespace-pre-wrap leading-tight line-clamp-3" title={selectedAppointment.custom_service || selectedAppointment.service_type}>
                  {selectedAppointment.service_type === 'Other' 
                    ? `Other (${selectedAppointment.custom_service || 'No details'})` 
                    : selectedAppointment.service_type}
                </p>
              </section>

              {/* Schedule & Dentist Grid */}
              <div className="grid grid-cols-2 gap-8 pt-4 border-t border-gray-50">
                <section>
                  <h3 className="text-xs uppercase text-black font-bold mb-2 tracking-[0.2em]">Schedule</h3>
                  <p className="text-black font-medium leading-tight">
                    {new Date(selectedAppointment.appointment_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-black font-medium">{selectedAppointment.preferred_time}</p>
                </section>
                <section>
                  <h3 className="text-xs uppercase text-black font-bold mb-2 tracking-[0.2em]">Dentist</h3>
                  <p className="text-black font-medium">{getDentistName(selectedAppointment.preferred_dentist)}</p>
                </section>
              </div>

              {/* Medical Conditions & Notes Section */}
              <section className="pt-6 border-t border-gray-100">
                <h3 className="text-xs uppercase text-black font-bold mb-4 tracking-[0.2em]">Medical Conditions & Notes</h3>
                <div className="space-y-4">
                  <p className="text-sm text-gray-700 font-medium break-all whitespace-pre-wrap">
                    {selectedAppointment.medical_conditions?.length > 0 
                      ? selectedAppointment.medical_conditions.join(', ') 
                      : 'No medical conditions listed.'}
                  </p>
                  
                  {/* Additional Notes Box */}
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 min-w-0">
                    <span className="text-[10px] uppercase text-gray-400 font-black tracking-widest block mb-1.5">Additional Notes</span>
                    <p className="text-gray-600 text-sm italic break-all whitespace-pre-wrap leading-relaxed">
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