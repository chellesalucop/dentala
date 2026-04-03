import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Link, useNavigate, useLocation, Navigate, Outlet } from 'react-router-dom';
import { Home, Calendar as CalendarIcon, ClipboardList, Settings, User as UserIcon, X, LogOut, LayoutDashboard, Users } from 'lucide-react';

// Patient Pages Imports
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import HomePage from './pages/HomePage';
import AppointmentFormPage from './pages/AppointmentFormPage'; 
import AppointmentSummaryPage from './pages/AppointmentSummaryPage';
import MyAppointmentsPage from './pages/MyAppointmentsPage';
import SettingsPage from './pages/SettingsPage';
import { API_URL } from './api';


// Admin Pages Imports
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminAppointmentsPage from './pages/AdminAppointmentsPage';
import AdminPatientsPage from './pages/AdminPatientsPage';

// --- PROTECTED ROUTE COMPONENT ---
const ProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem('auth_token');
  const userString = localStorage.getItem('user');
  
  if (!token || !userString) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userString);
  
  // Logic: If we passed allowedRoles, check them. If not, just ensure they are logged in.
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? "/admin/dashboard" : "/"} replace />;
  }

  return <Outlet />;
};

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeModal, setActiveModal] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userString = localStorage.getItem('user');
  let userObj = userString ? JSON.parse(userString) : null;
  let displayName = userObj?.email || 'User'; 
  let userRole = userObj?.role || 'patient';
  let profilePhoto = userObj?.profile_photo_path 
    ? `${API_URL}/storage/${userObj.profile_photo_path}` 
    : null;

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      try {
        await fetch(`${API_URL}/api/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
      } catch (error) {
        console.error("Logout request failed", error);
      }
    }
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-1 rounded-md transition-colors no-underline ${
      isActive ? 'bg-white !text-black font-semibold shadow-sm' : '!text-black hover:bg-white/20' 
    }`;

  const footerLinkClass = "!text-black hover:underline cursor-pointer no-underline";

  const openModal = (e, title, content) => {
    e.preventDefault(); 
    setActiveModal({ title, content });
  };

  const closeModal = () => setActiveModal(null);

  const modalData = {
    about: "Dentala: Your Smile, Simplified. We combine expert dental care with a seamless digital platform to help you manage your oral health with ease. Dedicated to excellence, one patient at a time. Dentala is an online dental appointment system where patients can book dental services, and Dentists can manage their patients information and appointments all in one web application.",
    faqs: `1. What is Dentala?
Dentala is a web app for managing dental appointments and patient records in a simple and efficient way.

2. What can Dentala do?
Dentala allows clients to book appointments through the web app, and dentists can review, approve, or manage those appointment requests to ensure proper scheduling.

3. What information does the web app collect?
Dentala collects basic patient details such as name, contact information, appointment schedules, and dental records.

4. Is my data safe in the web app?
Yes. Dentala uses secure login and access control to protect user and patient information.

5. Does the web app share my information?
No. Your data is not shared with third parties unless required by law or with your consent.

6. Can I update my information?
Yes. Authorized users can access and update records when needed.`,
    privacy: `Dentala is an online application that aims to provide an efficient clinic service while ensuring the privacy of its users. The information we collect from our users is limited to what is required to provide the best clinic services. This includes patient names, contact information, appointment schedules, and dental records.

The information we collect is stored securely within the system, but only authorized personnel such as clinic staff and dentists can access the information. We also ensure the security of the information by implementing security measures such as authentication.

We do not disclose personal information and dental records to third parties except when required by law. The information we collect from the user is used to provide the best clinic services.

The user also has the right to access, edit, or request the deletion of personal information depending on the clinic's policy. By accessing the Dentala web application, the user agrees to the collection and use of the information provided for the stated purposes.`,
    terms: `Terms and Conditions

When you use our web application, you agree with the following rules. Please take your time to read them carefully.

1. Acceptance of Terms
When you create an account or use Dentala, you agree to follow Terms and Conditions, as well as our Privacy Policy. If you do not agree, you may not use our service.

2. Description of Service
Dentala provides an online platform that:
Patients can look through the different dental services we offer and book an appointment that fits their schedule.
Allows Dentists to manage schedules, approve appointments, and maintain patient records.

3. User Accounts
When you sign up, you agree to provide your email address. You are held responsible for maintaining the confidentiality of your own credentials. Dentala will not be held accountable for unauthorized access resulting from insecure credential management.

4. Appointment Booking
When you make an appointment request through the web application, it does not automatically result in a successful appointment. You have to wait for the dentist or clinic to officially approve it first. An email will be sent notifying you for appointment confirmation.

5. Use of Data & Privacy
When you use Dentala, you agree to follow our Privacy Policy. We collect and store the following information:
Contact information and dental records.
Appointment history. Access to this data is restricted to authorized clinic personnel (dentists and staff) to ensure professional care and scheduling efficiency.

6. Prohibited Conduct
Users agree not to:
Submit false or misleading medical information.
Attempt to bypass the app's security measures.
Do not use the platform for anything that is unlawful.`
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password';

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-800 bg-dentalBg relative">
      
      {!isAuthPage && (
        <header className="bg-dentalBlue text-black py-4 px-8 flex justify-between items-center shadow-md">
          <Link to={userRole === 'admin' ? "/admin/dashboard" : "/"} className="flex items-center gap-2 text-xl font-bold !text-black no-underline">
            <img src="/images/logo.png" alt="Dentala Logo" className="w-8 h-8" /> Dentala
          </Link>
          
          <nav className="flex gap-6 items-center font-medium">
            {userRole === 'admin' ? (
              <>
                <NavLink to="/admin/dashboard" className={navLinkClass}><LayoutDashboard size={18}/> Dashboard</NavLink>
                <NavLink to="/admin/appointments" className={navLinkClass}><ClipboardList size={18}/> Appointments</NavLink>
                <NavLink to="/admin/patients" className={navLinkClass}><Users size={18}/> Patients</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/" className={navLinkClass}><Home size={18}/> Home</NavLink>
                <NavLink to="/appointment" className={navLinkClass}><CalendarIcon size={18}/> Book Appointment</NavLink>
                <NavLink to="/my-appointments" className={navLinkClass}><ClipboardList size={18}/> My Appointments</NavLink>
                <NavLink to="/settings" className={navLinkClass}><Settings size={18}/> Settings</NavLink>
              </>
            )}
          </nav>
          
          {/* 🛡️ Header User Section Sync */}
          <div className="flex items-center gap-6">
            {/* Existing Hi User & Profile section */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 font-semibold bg-transparent border-none cursor-pointer hover:opacity-90 transition-all p-0"
              >
                <span className="hidden md:inline">{displayName}</span>
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-black bg-white flex items-center justify-center shadow-sm">
                  {profilePhoto ? (
                    <img src={profilePhoto} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                    <UserIcon size={20} className="text-gray-400" />
                  )}
                </div>
              </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in-up">
                <div className="px-4 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                  <div className="text-left overflow-hidden">
                    <p className="font-bold text-gray-900 truncate mb-0 leading-tight">{displayName}</p>
                    <p className="text-[10px] uppercase font-bold text-dentalBlue tracking-wider">{userRole}</p>
                  </div>
                </div>

                <div className="py-1 text-left">
                  <Link to="/settings" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 no-underline">
                    <Settings size={16} /> Account Settings
                  </Link>
                  {userRole === 'patient' && (
                    <Link to="/my-appointments" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 no-underline">
                      <ClipboardList size={16} /> My Appointments
                    </Link>
                  )}
                </div>
                
                <div className="border-t border-gray-100 py-1">
                  <button onClick={handleLogout} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 border-none bg-transparent cursor-pointer transition-colors">
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </header>
      )}

      <main className={`flex-grow w-full mx-auto ${isAuthPage ? '' : 'max-w-6xl p-6'}`}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          
          {/* 1. UNIVERSAL PROTECTED ROUTES (Both Admin & Patient) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* 2. PATIENT-ONLY ROUTES */}
          <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/appointment" element={<AppointmentFormPage />} />
            <Route path="/appointment/summary" element={<AppointmentSummaryPage />} />
            <Route path="/my-appointments" element={<MyAppointmentsPage />} />
          </Route>

          {/* 3. ADMIN-ONLY ROUTES */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/appointments" element={<AdminAppointmentsPage />} />
            <Route path="/admin/patients" element={<AdminPatientsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isAuthPage && (
        <footer className="bg-dentalYellow py-8 px-8 grid grid-cols-1 md:grid-cols-4 gap-8 text-left border-t border-black/5">
          {/* ... Original Footer Content ... */}
          <div>
            <div className="flex items-center gap-2 text-2xl font-bold mb-4 text-black">
              <img src="/images/logo.png" alt="Dentala Logo" className="w-10 h-10" /> Dentala
            </div>
            <p className="text-sm italic text-black">Providing exceptional dental care with a commitment to your health and beautiful smiles.</p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-black">Help</h3>
            <ul className="text-sm space-y-2 italic text-black list-none p-0">
              <li><a onClick={(e) => openModal(e, 'About Us', modalData.about)} className={footerLinkClass}>About Us</a></li>
              <li><a onClick={(e) => openModal(e, 'FAQS', modalData.faqs)} className={footerLinkClass}>FAQS</a></li>
              <li><a onClick={(e) => openModal(e, 'Privacy Policy', modalData.privacy)} className={footerLinkClass}>Privacy Policy</a></li>
              <li><a onClick={(e) => openModal(e, 'Terms and Condition', modalData.terms)} className={footerLinkClass}>Terms and Condition</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-black">Contact Us</h3>
            <ul className="text-sm space-y-4 text-black list-none p-0">
              <li className="flex items-start gap-3">
                <img src="/images/location.png" alt="Location" className="w-5 h-5 mt-0.5" />
                <span>1611 Dentala City, 1234 St.</span>
              </li>
              <li className="flex items-start gap-3">
                <img src="/images/phone.png" alt="Phone" className="w-5 h-5 mt-0.5" />
                <span>+639155555555</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-black">Social</h3>
            <div className="flex items-center gap-4">
               <a href="https://www.facebook.com/profile.php?id=61576479103227" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition"><img src="/images/facebook.png" alt="FB" className="w-6 h-6" /></a>
               <a href="https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.instagram.com%2Fdentalawebapp%2F%3Ffbclid%3DIwZXh0bgNhZW0CMTAAYnJpZBExRmR6ZzZhUEZFQzdJczlQZHNydGMGYXBwX2lkEDIyMjAzOTE3ODgyMDA4OTIAAR6k3306bleBiSPPFs9GOXSL9-KxzH5uVY8WrHlh1lmD-u-6-DzaDvD3Cfnvmg_aem_v5_Gx-FuztNfRqct0nyO3g&h=AT6l_SLB8v9v4TygD6SJgz4X_gYg3pguF5sjINBJwBsuyjruWPlkvWnozvAmcdE41p_H3XcADB4GmsOc53lhm5RsIaboF_EvQMmeblYZuPGy9FOXsvON882gm48ELpAgef7Iig" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition"><img src="/images/instagram.png" alt="IG" className="w-6 h-6" /></a>
            </div>
          </div>
        </footer>
      )}

      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity px-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] p-8 relative animate-fade-in-up flex flex-col">
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full p-1 transition border-none bg-transparent cursor-pointer">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-4 text-dentalBlue border-b pb-2 text-left">{activeModal.title}</h2>
            <div className="flex-1 overflow-y-auto pr-2 text-gray-700 whitespace-pre-line leading-relaxed text-left">
              {activeModal.content}
            </div>
            <div className="mt-8 text-right">
              <button onClick={closeModal} className="bg-gray-200 text-gray-800 font-semibold py-2 px-6 rounded hover:bg-gray-300 transition border-none cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}