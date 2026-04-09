import React, { useState, useEffect } from 'react';
import { API_URL, getProfilePhotoUrl } from '../api';
import { storage } from '../utils/localStorage';
import { Camera, User as UserIcon } from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    specialization: '',
    hmo_provider: 'None',
    current_password: '',
    password: '',
    password_confirmation: ''
  });

  const [preview, setPreview] = useState(null);
  const [hmoPreview, setHmoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [hmoUploading, setHmoUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const token = localStorage.getItem('auth_token');

  // 🛡️ PERSISTENCE FIX: Enhanced user data loading with HMO data and cross-tab sync
  useEffect(() => {
    const user = storage.getUser();
    if (user) {
      setUser(user);
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
        specialization: user.specialization || '',
        hmo_provider: user.hmo_provider || 'None'
      }));

      if (user.profile_photo_path) {
        setPreview(getProfilePhotoUrl(user.profile_photo_path));
      }
      if (user.hmo_card_path) {
        setHmoPreview(getProfilePhotoUrl(user.hmo_card_path));
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const onlyNums = value.replace(/[^0-9]/g, '');
      if (onlyNums.length <= 11) {
        setFormData(prev => ({ ...prev, [name]: onlyNums }));
      }
      return;
    }

    if (name === "email") {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|tip\.edu\.ph)$/;
      setErrors(prev => ({ 
        ...prev, 
        email: emailRegex.test(value) ? '' : 'Please use a valid email address.' 
      }));
    }

    if (name.includes('password')) {
       setErrors(prev => ({ ...prev, passwordError: '', general: '' }));
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!formData.name) {
      setErrors({ name: "Full name is required." });
      return;
    }

    if (formData.phone.length !== 11) {
      setErrors({ phone: "Phone number must be exactly 11 digits." });
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|tip\.edu\.ph)$/;
    if (!emailRegex.test(formData.email)) {
      setErrors({ email: "Please use a valid email address." });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          specialization: formData.specialization,
          hmo_provider: formData.hmo_provider
        })
      });

      const data = await response.json();
      if (response.ok) {
        // 🛡️ PERSISTENCE FIX: Update localStorage and trigger sync across all tabs
        storage.setUser(data.user);
        setUser(data.user);
        
        alert("Profile updated successfully!");
        // 🛡️ SOFT REFRESH: Update form data instead of full page reload
        setFormData(prev => ({
          ...prev,
          name: data.user.name || '',
          phone: data.user.phone || '',
          email: data.user.email || '',
          hmo_provider: data.user.hmo_provider || 'None'
        }));
      } else if (data.errors) {
        setErrors(data.errors);
      } else {
        alert("Server Error: " + (data.message || "Failed to save profile. Please check if your database is up to date via the /api/run-migrations URL."));
      }
    } catch (error) { 
      console.error(error); 
      alert("Connection Error: Could not reach the server.");
    }

  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/user/password`, {
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
      } else {
        setErrors({ passwordError: data.message || "An error occurred." });
      }
    } catch (err) {
      setErrors({ general: "Connection error." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const imageForm = new FormData();
    imageForm.append('image', file);

    try {
      const response = await fetch(`${API_URL}/api/user/profile-picture`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: imageForm
      });

      if (response.ok) {
        const data = await response.json();
        storage.setUser(data.user);
        setPreview(getProfilePhotoUrl(data.user.profile_photo_path));
        
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

  const handleHmoCardChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Image is too large. 2MB maximum.");
      return;
    }

    setHmoUploading(true);
    const imageForm = new FormData();
    imageForm.append('image', file);

    try {
      const response = await fetch(`${API_URL}/api/user/hmo-card`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: imageForm
      });

      if (response.ok) {
        const data = await response.json();
        storage.setUser(data.user);
        setHmoPreview(getProfilePhotoUrl(data.user.hmo_card_path));
        
        alert("HMO Card updated successfully!");
      } else {
        alert("Failed to upload HMO Card.");
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setHmoUploading(false);
    }
  };

  if (!user) return <div className="p-10 text-center">Loading Settings...</div>;

  return (
    <div className="max-w-4xl space-y-8 pb-12 text-left">
      <div>
        <h1 className="text-2xl font-bold mb-1">Account Settings</h1>
        <p className="text-gray-600 text-sm font-medium">Manage your personal information and security</p>
      </div>

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
            <label className="absolute bottom-0 right-0 bg-[#007bff] p-2.5 rounded-full text-white cursor-pointer hover:bg-blue-600 transition shadow-lg border-2 border-white">
              <Camera size={20} />
              <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
            </label>
          </div>
          <p className="mt-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {uploading ? 'Uploading...' : 'Profile Picture'}
          </p>
        </div>

        <form onSubmit={handleProfileUpdate}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="md:col-span-2">
              <label className="block font-bold text-sm mb-2">Full Name</label>
              <input
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className={`w-full p-3 border rounded-md outline-none transition ${
                  errors.name ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'
                }`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {user.role === 'admin' && (
              <div className="md:col-span-2">
                <label className="block font-bold text-sm mb-2">Specialization</label>
                <input
                  name="specialization"
                  type="text"
                  value={formData.specialization}
                  onChange={handleChange}
                  placeholder="e.g., Orthodontics / General Dentistry"
                  className={`w-full p-3 border rounded-md outline-none transition ${
                    errors.specialization ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'
                  }`}
                />
              </div>
            )}

            <div>
              <label className="block font-bold text-sm mb-2">Email</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full p-3 border rounded-md outline-none transition ${
                  errors.email ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'
                }`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block font-bold text-sm mb-2">Phone Number</label>
              <input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full p-3 border rounded-md outline-none transition ${
                  errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'
                }`}
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            {user.role === 'patient' && (
              <div className="md:col-span-2 border-t pt-6 mt-2">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-1 w-full">
                    <label className="block font-bold text-sm mb-1 uppercase tracking-wider text-gray-500">HMO Provider</label>
                    <p className="text-[10px] font-bold text-blue-600 mb-2">Accepted HMOs</p>
                    <select
                      name="hmo_provider"
                      value={formData.hmo_provider}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md outline-none focus:ring-2 focus:ring-blue-500 transition font-medium"
                    >
                      <option value="None">None</option>
                      <option value="Medicard">Medicard</option>
                      <option value="Maxicare">Maxicare</option>
                    </select>
                  </div>

                  {(formData.hmo_provider === 'Medicard' || formData.hmo_provider === 'Maxicare') && (
                    <div className="flex-1 w-full animate-fade-in">
                      <label className="block font-bold text-sm mb-1 uppercase tracking-wider text-gray-500">HMO Card Image</label>
                      <p className="text-[10px] font-bold text-gray-400 mb-3">Upload a clear photo of your card (Max 2MB)</p>
                      
                      <div className="relative group">
                        <div className="w-full h-32 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden transition group-hover:border-blue-400">
                          {hmoPreview ? (
                            <img src={hmoPreview} className="w-full h-full object-cover" alt="HMO Card" />
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-400">
                               <Camera size={24} />
                               <span className="text-[10px] font-bold uppercase">Click to select</span>
                            </div>
                          )}
                          {hmoUploading && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                              <span className="text-xs font-bold text-blue-600 animate-pulse uppercase">Uploading...</span>
                            </div>
                          )}
                        </div>
                        <input 
                          type="file" 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          onChange={handleHmoCardChange} 
                          accept="image/*"
                          disabled={hmoUploading}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button type="submit" className="bg-[#0b132b] text-white font-bold py-2.5 px-10 rounded-md hover:bg-gray-800 transition cursor-pointer border-none">
              Save Changes
            </button>
          </div>
        </form>
      </div>

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
          {errors.passwordError && <p className="text-red-500 text-xs mb-2">{errors.passwordError}</p>}
          {errors.general && <p className="text-red-500 text-xs mb-2">{errors.general}</p>}
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
  );
}