import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  // Step state: 1 = Email Request, 2 = OTP Verification, 3 = Change Password
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Request state
  const [email, setEmail] = useState('');

  // Step 2: OTP state
  const [otp, setOtp] = useState(new Array(6).fill(''));
  const [timer, setTimer] = useState(300); // 5 minutes in seconds
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [verificationToken, setVerificationToken] = useState(''); // ✅ Store token from Step 2
  const inputRefs = useRef([]);

  // Step 3: Password state
  const [passwordData, setPasswordData] = useState({
    password: '',
    password_confirmation: ''
  });

  // Common states
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer(timer => timer - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer]);

  // Format timer display
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle OTP input changes
  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;
    
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Focus next box automatically
    if (element.value && element.nextSibling) {
      element.nextSibling.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (newOtp.every(digit => digit !== '')) {
      handleOtpSubmit(newOtp.join(''));
    }
  };

  // Handle OTP keydown for backspace navigation
  const handleOtpKeyDown = (element, index) => {
    if (element.key === 'Backspace' && !element.value && element.previousSibling) {
      element.previousSibling.focus();
    }
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrors({});
    
    // THE ULTIMATE BYPASS KILLER:
    // We check for a dot and at least 2 characters at the end manually.
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;  
    if (!emailRegex.test(email)) {
      setErrors({ general: "Please enter a valid email address (e.g., name@domain.com)." });
      return; // STOP: API call right here!
    }
    
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log("Server Response:", data); // <--- OPEN F12 AND LOOK AT THIS!

      if (!response.ok) {
        // Handle specific error types
        if (response.status === 500) {
          setErrors({ general: "Mail service is temporarily unavailable. Please try again later." });
        } else if (response.status === 422) {
          // If you see "The email has already been taken" here, 
          // it's because of the StoreUserRequest 'unique' rule!
          setErrors({ general: data.errors?.email?.[0] || data.message || 'Please enter a valid email address.' });
        } else {
          setErrors({ general: data.message || 'Unable to send OTP. Please try again.' });
        }
        return;
      }

      // If we get here, the email is officially in the "sending" queue
      setCurrentStep(2);
      setIsTimerActive(true);
      setTimer(300);
      
      // Optional: Show a "toast" or notification
      alert(`OTP sent to ${email}! Please check your inbox.`);

    } catch (err) {
      console.error('Connection Error:', err);
      setErrors({ general: "Mail service is temporarily unavailable. Please try again later." });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleOtpSubmit = async (otpCode) => {
    setErrors({});
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          otp: otpCode 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.message || 'Invalid OTP.' });
        return;
      }

      // Move to step 3
      setVerificationToken(data.verification_token); // ✅ Save it here!
      setCurrentStep(3);

    } catch (err) {
      console.error('Connection Error:', err);
      setErrors({ general: 'Failed to connect to the server.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    setOtp(new Array(6).fill(''));
    setErrors({});
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.message || 'Unable to resend OTP.' });
        return;
      }

      // Reset timer
      setIsTimerActive(true);
      setTimer(300);

    } catch (err) {
      console.error('Connection Error:', err);
      setErrors({ general: 'Failed to connect to the server.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      // ❌ WRONG: fetch('http://127.0.0.1:8000/api/change-password', ...)
      // ✅ CORRECT: Must match your api.php route name
      const response = await fetch('http://127.0.0.1:8000/api/reset-password-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: email, 
          verification_token: verificationToken, // Must match Backend's $request->verification_token
          password: passwordData.password,
          password_confirmation: passwordData.password_confirmation // ✅ MUST MATCH THIS EXACT KEY
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // ✅ DISPLAY THE ACTUAL ERROR (e.g., "The password confirmation does not match")
        const errorMessage = data.errors 
          ? Object.values(data.errors).flat().join(' ') 
          : data.message;
        setErrors({ general: errorMessage });
        return;
      }

      alert('Password successfully changed!');
      navigate('/login');

    } catch (err) {
      console.error('Connection Error:', err);
      setErrors({ general: 'Failed to connect to the server.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes - hard block logic for security gate
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (currentStep === 1) {
      // 🛡️ HARD BLOCK: Email (Letters, Numbers, @, ., - only)
      const filteredValue = value.replace(/[^a-zA-Z0-9@.-]/g, '');
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setEmail(filteredValue);
      setErrors(prev => ({ 
        ...prev, 
        email: emailRegex.test(filteredValue) ? '' : 'Please enter a valid email address.' 
      }));
    } else if (currentStep === 3) {
      setPasswordData({
        ...passwordData,
        [name]: value
      });
    }
    
    // Clear general error when user types
    if (errors.general) {
      setErrors({});
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
          <div className="border border-gray-200 rounded-lg p-8 shadow-sm">
            <h2 className="text-[22px] font-bold text-center text-gray-900 mb-6">
              {currentStep === 1 && 'Forgot Password'}
              {currentStep === 2 && 'Enter OTP'}
              {currentStep === 3 && 'Change Password'}
            </h2>
            
            {/* Unified Error Box */}
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-center">
                <p className="text-red-600 text-[13px] font-medium">
                  {errors.general}
                </p>
              </div>
            )}

            {/* STEP 1: EMAIL REQUEST */}
            {currentStep === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    name="email"
                    value={email}
                    onChange={handleChange}
                    placeholder="email@domain.com"
                    required
                    pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                    onInvalid={(e) => {
                      // 1. STOP the black bubble from appearing
                      e.preventDefault(); 
                      
                      // 2. Trigger your custom red box instead
                      setErrors({ general: "Please enter a valid email address (e.g., name@domain.com)." });
                    }}
                    onInput={(e) => {
                      // Clear the error as soon as they start fixing it
                      if (errors.general) setErrors({});
                    }}
                    className={`w-full p-2.5 bg-white text-gray-900 border rounded-md focus:outline-none focus:ring-2 text-sm transition-colors ${
                      errors.email || errors.general
                        ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                        : 'border-gray-300 focus:ring-[#5b9bd5]'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                <button 
                  type="submit" 
                  className={`w-full py-2.5 text-white text-sm font-semibold rounded-md transition-colors mt-2 cursor-pointer ${
                    isLoading
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-[#5b9bd5] hover:bg-[#4a8ac4]'
                  }`}
                >
                  {isLoading ? 'Sending...' : 'Send OTP'}
                </button>

                <div className="mt-6 text-center">
                  <Link to="/login" className="text-sm text-gray-500 hover:text-blue-500 flex items-center justify-center">
                    <span className="mr-2">←</span> Back to Login
                  </Link>
                </div>
              </form>
            )}

            {/* STEP 2: OTP VERIFICATION */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <p className="text-center text-sm text-gray-600 mb-4">
                    Enter the 6-digit code sent to {email}
                  </p>
                  
                  {/* Timer Display */}
                  <div className="text-center mb-4">
                    <span className={`text-lg font-semibold ${timer <= 60 ? 'text-red-500' : 'text-gray-700'}`}>
                      {formatTime(timer)}
                    </span>
                  </div>

                  {/* 6-Box OTP Input */}
                  <div className="flex justify-center gap-2 mb-4">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target, index)}
                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        ref={el => inputRefs.current[index] = el}
                        disabled={!isTimerActive && timer === 0}
                        className={`w-12 h-12 text-center text-lg font-semibold border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5b9bd5] transition-colors ${
                          (!isTimerActive && timer === 0)
                            ? 'bg-gray-100 border-gray-300 cursor-not-allowed'
                            : 'bg-white border-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Resend OTP Button */}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isTimerActive || isLoading}
                  className={`w-full py-2.5 text-sm font-semibold rounded-md transition-colors cursor-pointer ${
                    isTimerActive || isLoading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-[#5b9bd5] text-white hover:bg-[#4a8ac4]'
                  }`}
                >
                  {isLoading ? 'Resending...' : 'Resend OTP'}
                </button>

                <div className="mt-6 text-center">
                  <Link to="/login" className="text-sm text-gray-500 hover:text-blue-500 flex items-center justify-center">
                    <span className="mr-2">←</span> Back to Login
                  </Link>
                </div>
              </div>
            )}

            {/* STEP 3: CHANGE PASSWORD */}
            {currentStep === 3 && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">New Password</label>
                  <input 
                    type="password" 
                    name="password"
                    value={passwordData.password}
                    onChange={handleChange}
                    required 
                    placeholder="Enter new password"
                    className={`w-full p-2 bg-white text-gray-900 border rounded-md focus:outline-none focus:ring-2 text-sm transition-colors ${
                      // ONLY turn red if there is a password error AND it's NOT a confirmation mismatch
                      (errors.password && !errors.password[0]?.includes('confirmation')) 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-[#5b9bd5]'
                    }`} 
                  />
                  {/* ONLY show min-length or required errors here */}
                  {errors.password && !errors.password[0]?.includes('confirmation') && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.password[0]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    name="password_confirmation"
                    value={passwordData.password_confirmation}
                    onChange={handleChange}
                    required 
                    placeholder="Confirm new password"
                    className={`w-full p-2 bg-white text-gray-900 border rounded-md focus:outline-none focus:ring-2 text-sm transition-colors ${
                      // Turn red if the dedicated confirmation error exists OR if the password error mentions confirmation
                      (errors.password_confirmation || (errors.password && errors.password[0]?.includes('confirmation'))) 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-[#5b9bd5]'
                    }`} 
                  />
                  {/* SHOW the mismatch error here */}
                  {(errors.password_confirmation || (errors.password && errors.password[0]?.includes('confirmation'))) && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Password confirmation does not match
                    </p>
                  )}
                </div>

                <button 
                  type="submit" 
                  className={`w-full py-2.5 text-white text-sm font-semibold rounded-md transition-colors mt-2 cursor-pointer ${
                    isLoading
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-[#5b9bd5] hover:bg-[#4a8ac4]'
                  }`}
                >
                  {isLoading ? 'Changing...' : 'Change Password'}
                </button>

                <div className="mt-6 text-center">
                  <Link to="/login" className="text-sm text-gray-500 hover:text-blue-500 flex items-center justify-center">
                    <span className="mr-2">←</span> Back to Login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
