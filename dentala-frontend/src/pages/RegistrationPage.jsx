import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function RegistrationPage() {
  const navigate = useNavigate();

  // 1. State to hold the form inputs
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    terms: false
  });

  // 2. State to hold validation errors from Laravel and a loading state
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // 🛡️ ZONE A: REGISTRATION ONLY - Strict Gate Validation
  const validateRegisterEmail = (email) => {
    const allowedDomains = ['gmail.com', 'yahoo.com', 'tip.edu.ph'];
    const domain = email.split('@')[1];
    
    if (!domain || !allowedDomains.includes(domain.toLowerCase())) {
      return "Please use a valid email (Gmail, Yahoo, or TIP only).";
    }
    return "";
  };

  // 3. Handle input changes - zone-specific validation for registration gate
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // 🛡️ UPDATED: Clear errors but don't validate while typing
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name]; 
      return newErrors;
    });

    if (name === 'phone') {
      const onlyNums = value.replace(/[^0-9]/g, '');
      if (onlyNums.length <= 11) {
        setFormData(prev => ({ ...prev, [name]: onlyNums }));
      }
      return;
    }

    if (name === 'email') {
      const filteredValue = value.replace(/[^a-zA-Z0-9@.-]/g, '');
      setFormData(prev => ({ ...prev, [name]: filteredValue }));
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 🛡️ NEW: "Patience" Logic - Validate only when user finishes typing
  const handleBlur = (e) => {
    const { name, value } = e.target;

    if (name === 'email' && value !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isFormatValid = emailRegex.test(value);
      
      let errorMessage = "";
      if (!isFormatValid) {
        errorMessage = "Please enter a valid email address.";
      } else {
        errorMessage = validateRegisterEmail(value);
      }

      setErrors(prev => ({ ...prev, email: errorMessage }));
    }
    
    if (name === 'phone' && value !== "" && value.length < 11) {
      setErrors(prev => ({ ...prev, phone: "Phone number must be exactly 11 digits." }));
    }
  };

  // 4. Fixed fetch logic to handle 422 status properly
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      // Check if the "Judge" (Backend) found errors
      if (!response.ok) {
        if (response.status === 422) {
          setErrors(data.errors); // Display the red lines/text
        } else {
          alert("An unexpected error occurred.");
        }
        return; // Stop here if there are errors
      }

      // Success logic only runs if response.ok is true
      alert("Account successfully created!");
      navigate('/login');

    } catch (err) {
      // This only runs for network/connection failures
      console.error("Connection Error:", err);
      alert("Failed to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex fixed inset-0 z-50 bg-white">
      {/* LEFT SIDE */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img src="/images/clinic.jpg" alt="Clinic" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="flex items-center gap-5">
            <img src="/images/logo.png" alt="Dentala Logo" className="w-[80px] h-[80px] object-contain" />
            <div className="text-left text-white">
              <h1 className="text-4xl font-bold mb-2 tracking-wide">Dentala</h1>
              <p className="text-[17px] text-white/95 leading-snug">Brilliant Scheduling<br />for Brighter Smiles</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-sm">
          <h2 className="text-[22px] font-bold text-center text-gray-900 mb-8">Register</h2>
          
          <form onSubmit={handleRegister} className="space-y-[14px]">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="text" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur} // Wait for the user to finish
                required 
                placeholder="email@domain.com"
                className={`w-full p-2 bg-white text-gray-900 border rounded-md focus:outline-none focus:ring-2 text-sm transition-colors ${
                  errors.email 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-[#5b9bd5]'
                }`} 
              />
              {/* Backend error messages - Simple echo of Laravel responses */}
              {errors.email && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {/* 🛡️ If it's an array (Laravel), take index 0. If string (Frontend), show it all. */}
                  {Array.isArray(errors.email) ? errors.email[0] : errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1">Phone Number</label>
              <input 
                type="tel" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur} // Wait for the user to finish
                required 
                pattern="[0-9]{11}"
                title="Phone number must be exactly 11 digits"
                placeholder="09123456789"
                onInvalid={(e) => {
                  if (e.target.value === "") {
                    return; 
                  }

                  e.preventDefault(); 
                  setErrors(prev => ({...prev, phone: "Phone number must be exactly 11 digits."}));
                }}
                onInput={(e) => e.target.setCustomValidity('')}
                className={`w-full p-2 bg-white text-gray-900 border rounded-md focus:outline-none focus:ring-2 text-sm transition-colors ${errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`} 
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.phone}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                required 
                placeholder="Create a strong password"
                className={`w-full p-2 bg-white text-gray-900 border rounded-md focus:outline-none focus:ring-2 text-sm transition-colors ${
                  // ONLY turn red if there is a password error AND it's NOT a confirmation mismatch
                  (errors.password && !errors.password[0].includes('confirmation')) 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-[#5b9bd5]'
                }`} 
              />
              {/* ONLY show min-length or required errors here */}
              {errors.password && !errors.password[0].includes('confirmation') && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.password[0]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1">Confirm Password</label>
              <input 
                type="password" 
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                required 
                placeholder="Confirm your password"
                className={`w-full p-2 bg-white text-gray-900 border rounded-md focus:outline-none focus:ring-2 text-sm transition-colors ${
                  // Turn red if the dedicated confirmation error exists OR if the password error mentions confirmation
                  (errors.password_confirmation || (errors.password && errors.password[0].includes('confirmation'))) 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-[#5b9bd5]'
                }`} 
              />
              {/* SHOW the mismatch error here */}
              {(errors.password_confirmation || (errors.password && errors.password[0].includes('confirmation'))) && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Password confirmation does not match
                </p>
              )}
            </div>

            <div className="text-center mt-2 mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="terms"
                  id="terms"
                  checked={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.checked })}
                  required
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                  I agree to the <span className="text-blue-500 cursor-pointer hover:underline">Terms and Conditions</span>
                </label>
              </div>
            </div>

            <button 
              type="submit" 
              className={`w-full py-2.5 text-white text-sm font-semibold rounded-md transition-colors cursor-pointer ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-[#5b9bd5] hover:bg-[#4a8ac4]'
              }`}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>

            <Link to="/login" className="block w-full mt-4">
              <button type="button" className="w-full py-2.5 bg-white border-2 border-[#5b9bd5] text-[#5b9bd5] text-sm hover:bg-blue-50 font-semibold rounded-md transition-colors">
                Sign In
              </button>
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}