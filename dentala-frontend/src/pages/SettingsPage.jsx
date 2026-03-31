import React, { useState, useEffect } from 'react';

import { Camera, User as UserIcon } from 'lucide-react';



export default function SettingsPage() {

  // Ensure you are pointing to the BACKEND port (8000), not the frontend port (5173)

  const BASE_URL = "http://127.0.0.1:8000";

 

  const [formData, setFormData] = useState({

    phone: '',

    email: '',

    current_password: '',

    password: '',

    password_confirmation: ''

  });



  const [preview, setPreview] = useState(null);

  const [uploading, setUploading] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState({});

  const token = localStorage.getItem('auth_token');



  // Load user data on mount

  useEffect(() => {

    const userString = localStorage.getItem('user');

    if (userString) {

      const user = JSON.parse(userString);

      setFormData(prev => ({

        ...prev,

        phone: user.phone || '',

        email: user.email || ''

      }));

     

      // If user has a photo, point to the Laravel storage URL

      if (user.profile_photo_path) {

        setPreview(`${BASE_URL}/storage/${user.profile_photo_path}`);

      }

    }

  }, []);



  const handleChange = (e) => {

    const { name, value } = e.target;



    // 1. Handle Phone

    if (name === "phone") {

      const onlyNums = value.replace(/[^0-9]/g, '');

      if (onlyNums.length <= 11) {

        setFormData(prev => ({ ...prev, [name]: onlyNums }));

      }

      return;

    }



    // 2. Handle Email (Strict Isolation)

    if (name === "email") {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|tip\.edu\.ph)$/;
      setErrors(prev => ({ 
        ...prev, 
        email: emailRegex.test(value) ? '' : 'Please use a valid email address.' 
      }));
    }



    // 3. Handle Passwords (IMPORTANT: Do not touch email errors here)

    if (name.includes('password')) {

       // Clear the passwordError only when they start re-typing

       setErrors(prev => ({ ...prev, passwordError: '', general: '' }));

    }



    setFormData(prev => ({ ...prev, [name]: value }));

  };



  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setErrors({}); // Wipe the board for a fresh start

    // 🛡️ 1. Phone Number Guard -> Target 'phone' key
    if (formData.phone.length !== 11) {
      setErrors({ phone: "Phone number must be exactly 11 digits (e.g., 09123456789)." });
      return;
    }

    // 🛡️ 2. Email Shield -> Target 'email' key
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|tip\.edu\.ph)$/;
    if (!emailRegex.test(formData.email)) {
      setErrors({ email: "Please use a valid email address." });
      return;
    }

    try {

      const response = await fetch('http://127.0.0.1:8000/api/user/profile', {

        method: 'PUT',

        headers: {

          'Content-Type': 'application/json',

          'Authorization': `Bearer ${token}`,

          'Accept': 'application/json'

        },

        body: JSON.stringify({

          email: formData.email,

          phone: formData.phone

        })

      });



      const data = await response.json();

      if (response.ok) {

        // Sync the local user data with the new phone number

        const updatedUser = { ...JSON.parse(localStorage.getItem('user')), phone: data.user.phone };

        localStorage.setItem('user', JSON.stringify(updatedUser));

        alert("Profile updated successfully!");

      }

    } catch (error) { console.error(error); }

  };



  const handlePasswordUpdate = async (e) => {

    e.preventDefault();

 

    // CLEAR ALL ERRORS first so old "Email" errors disappear

    setErrors({});

    setIsLoading(true);



    try {

      const response = await fetch('http://127.0.0.1:8000/api/user/password', {

        method: 'PUT',

        headers: {

          'Content-Type': 'application/json',

          'Authorization': `Bearer ${token}`

        },

        body: JSON.stringify({

          current_password: formData.current_password,

          password: formData.password,

          password_confirmation: formData.password_confirmation

        }),

      });



      const data = await response.json();



      if (response.ok) {

        alert("Password updated successfully!");

        setFormData({ ...formData, current_password: '', password: '', password_confirmation: '' });

        setErrors({}); // Clear everything on success

      } else {

        // 🛡️ THE TRANSLATOR:

        // If backend sent a specific 'errors' object, pick the first helpful message.

        if (data.errors) {

          const errs = data.errors;



          // 🛡️ PRIORITY CHECK: If there is a confirmation error, show that FIRST

          if (errs.password && errs.password.some(m => m.includes('match'))) {

            setErrors({ passwordError: "The password confirmation does not match." });

          }

          // 🛡️ SECONDARY CHECK: Show the length requirement

          else if (errs.password) {

            setErrors({ passwordError: errs.password[0] });

          }

          // 🛡️ IDENTITY CHECK: Show current password error

          else if (errs.current_password) {

            setErrors({ passwordError: errs.current_password[0] });

          }

        } else {

          // Fallback if backend only sent a general 'message'

          setErrors({ passwordError: data.message || "An error occurred." });

        }

      }

    } catch (err) {

      setErrors({ general: "Connection error." });

    } finally {

      setIsLoading(false);

    }

  };



  // --- UPDATED: Image Upload with URL Refresh & Validation ---

  const handleImageChange = async (e) => {

    const file = e.target.files[0];

    if (!file) return;



    // 1. Define Constants

    const MAX_SIZE = 2 * 1024 * 1024; // 2MB

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];



    // 2. Helpful Size Validation

    if (file.size > MAX_SIZE) {

      alert("Image upload exceeded 2MB limit. Please select a smaller file.");

      e.target.value = ""; // Clear the input

      return;

    }



    // 3. Helpful Type Validation

    if (!ALLOWED_TYPES.includes(file.type)) {

      alert("Invalid file type! Please select a JPEG, PNG, or GIF image.");

      e.target.value = "";

      return;

    }



    // 4. Proceed with Upload if valid

    setUploading(true);

    setPreview(URL.createObjectURL(file));



    const imageForm = new FormData();

    imageForm.append('image', file);



    try {

      const response = await fetch('http://127.0.0.1:8000/api/user/profile-picture', {

        method: 'POST',

        headers: { 'Authorization': `Bearer ${token}` },

        body: imageForm

      });



      if (response.ok) {

        const data = await response.json();

       

        // 1. Update the LocalStorage so the Header also sees the new image

        localStorage.setItem('user', JSON.stringify(data.user));

       

        // 2. Set the preview to the actual storage URL from the server

        setPreview(`${BASE_URL}/storage/${data.user.profile_photo_path}`);

       

        alert("Profile photo updated successfully!");

      } else {

        alert("Failed to upload image.");

      }

    } catch (error) {

      console.error("Upload error:", error);

    } finally {

      setUploading(false);

    }

  };



  return (

    <div className="max-w-4xl space-y-8 pb-12 text-left">

      <div>

        <h1 className="text-2xl font-bold mb-1">Account Settings</h1>

        <p className="text-gray-600 text-sm font-medium">Manage your personal information and security</p>

      </div>



      {/* SECTION 1: PROFILE INFORMATION */}

      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">

        <div className="flex flex-col items-center mb-10">

          <div className="relative">

            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-md flex items-center justify-center">

              {preview ? (

                <img src={preview} className="w-full h-full object-cover" alt="Profile" />

              ) : (

                <UserIcon size={48} className="text-gray-300" />

              )}

            </div>

            <label className="absolute bottom-0 right-0 bg-dentalBlue p-2.5 rounded-full text-white cursor-pointer hover:bg-blue-600 transition shadow-lg border-2 border-white">

              <Camera size={20} />

              <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />

            </label>

          </div>

          <p className="mt-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">

            {uploading ? 'Uploading...' : 'Profile Picture'}

          </p>

        </div>



        <form onSubmit={handleProfileUpdate}>

          {/* 📱 SIDE-BY-SIDE LAYOUT IMPLEMENTED HERE */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            
            {/* 🛡️ POSITION 1: EMAIL (Left) */}
            <div>
              <label className="block font-bold text-sm mb-2">Email</label>
              <input
                name="email"  // Keep name="email" to trigger email-specific logic in handleChange
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full p-3 border rounded-md outline-none transition ${
                  errors.email ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'
                }`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* 🛡️ POSITION 2: PHONE NUMBER (Right) */}
            <div>
              <label className="block font-bold text-sm mb-2">Phone Number</label>
              <input
                name="phone"  // Keep name="phone" to trigger numeric masking in handleChange
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full p-3 border rounded-md outline-none transition ${
                  errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'
                }`}
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

          </div>

          <div className="flex justify-end">

            <button type="submit" className="bg-[#0b132b] text-white font-bold py-2.5 px-10 rounded-md hover:bg-gray-800 transition cursor-pointer border-none">

              Save Changes

            </button>

          </div>

        </form>

      </div>



      {/* SECTION 2: CHANGE PASSWORD */}

      <form onSubmit={handlePasswordUpdate} className="bg-white rounded-xl shadow-md border border-gray-200 p-8">

        <div className="flex items-center gap-3 font-bold text-lg mb-6 border-b pb-4">

          <img src="/images/lock.png" alt="Lock" className="w-6 h-6" /> Change Password

        </div>

        <div className="space-y-6">

          <div>

            <label className="block font-bold text-sm mb-2">Current Password</label>

            <input

              name="current_password"

              type="password"

              value={formData.current_password}

              onChange={handleChange}

              required

              className="w-full bg-gray-50 border border-gray-200 rounded-md p-3 focus:ring-2 focus:ring-dentalBlue outline-none"

            />

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div>

              <label className="block font-bold text-sm mb-2">New Password</label>

              <input

                name="password"

                type="password"

                value={formData.password}

                onChange={handleChange}

                required

                className="w-full bg-gray-50 border border-gray-200 rounded-md p-3 focus:ring-2 focus:ring-dentalBlue outline-none"

              />

            </div>

            <div>

              <label className="block font-bold text-sm mb-2">Confirm Password</label>

              <input

                name="password_confirmation"

                type="password"

                value={formData.password_confirmation}

                onChange={handleChange}

                required

                className="w-full bg-gray-50 border border-gray-200 rounded-md p-3 focus:ring-2 focus:ring-dentalBlue outline-none"

              />

            </div>

          </div>

        </div>

        <div className="flex flex-col items-end mt-8">

          {errors.passwordError && (

            <p className="text-red-500 text-xs mb-2">{errors.passwordError}</p>

          )}

          {errors.general && (

            <p className="text-red-500 text-xs mb-2">{errors.general}</p>

          )}

          <button

            type="submit"

            disabled={isLoading}

            className={`bg-white border-2 border-gray-300 text-black font-bold py-2 px-8 rounded-md hover:bg-gray-50 transition ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}

          >

            {isLoading ? 'Updating...' : 'Update Password'}

          </button>

        </div>

      </form>

    </div>

  ); // This closes the return (

} // This closes the function SettingsPage() {