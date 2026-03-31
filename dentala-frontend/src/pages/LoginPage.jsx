import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../api';

export default function LoginPage() {
  const navigate = useNavigate();

  // State Reset: Clear localStorage on component mount to prevent token mismatch
  useEffect(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }, []);

  // 1. State for form inputs
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });

  // 2. State for handling loading and errors
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // 3. Handle typing in inputs - ZONE B: LOGIN ONLY - Clean & Quiet
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Update state without triggering any local "Please enter..." errors
    setCredentials(prev => ({ ...prev, [name]: value }));

    // Clear "Invalid Credentials" message from the backend if it exists
    if (errors.general || errors[name]) {
      setErrors({});
    }
  };

  // 4. Handle login with passive validation and role-based redirection
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors({}); // Clear any previous "judgment"
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      // Check if the "Judge" (Backend) found errors
      if (!response.ok) {
        setErrors({ general: data.message || 'Invalid email or password.' });
        return; // Stop here if there are errors
      }

      // Success logic only runs if response.ok is true
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect based on the Role returned from the "Judge"
      if (data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/patient/portal');
      }

    } catch (err) {
      // This only runs for network/connection failures
      console.error('Connection Error:', err);
      setErrors({ general: 'Failed to connect to the server.' });
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
          {/* A box wrapping the login form exactly like your target image */}
          <div className="border border-gray-200 rounded-lg p-8 shadow-sm">
            <h2 className="text-[22px] font-bold text-center text-gray-900 mb-6">Log In</h2>
            
            {/* Error Box at the top of the form */}
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-center">
                <p className="text-red-600 text-[13px] font-medium">
                  {errors.general}
                </p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="text" 
                  name="email"
                  value={credentials.email}
                  onChange={handleChange}
                  placeholder="email@domain.com"
                  required 
                  title="Email address"
                  onInvalid={(e) => {
                      // We do NOT call e.preventDefault() here.
                      // We let the browser show "Please fill out this field" naturally.
                      e.target.setCustomValidity(''); 
                  }}
                  className={`w-full p-2.5 bg-white text-gray-900 border rounded-md focus:outline-none focus:ring-2 text-sm transition-colors ${
                    errors.general
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-[#5b9bd5]'
                  }`}
                />
              </div>
              
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">Password</label>
                <input 
                  type="password" 
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  required 
                  placeholder="Enter your password"
                  className={`w-full p-2.5 bg-white text-gray-900 border rounded-md focus:outline-none focus:ring-2 text-sm transition-colors ${
                    errors.general 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-[#5b9bd5]'
                  }`}
                />
              </div>

              <button 
                type="submit" 
                className={`w-full py-2.5 text-white text-sm font-semibold rounded-md transition-colors mt-2 cursor-pointer ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-[#5b9bd5] hover:bg-[#4a8ac4]'
                }`}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>

              <div className="flex justify-end mb-4">
                <Link 
                  to="/forgot-password" 
                  className="text-[12px] text-blue-500 hover:text-blue-600 hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <Link to="/register" className="block w-full">
                <button type="button" className="w-full py-2.5 bg-white border-2 border-[#5b9bd5] text-[#5b9bd5] text-sm hover:bg-blue-50 font-semibold rounded-md transition-colors">
                  Sign Up
                </button>
              </Link>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}