import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProfilePictureUpload from './ProfilePictureUpload';
import './SettingsPage.css';

const SettingsPage = ({ user, onUserUpdate, token }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});

  // Environment-based URL configuration
  const BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    if (user) {
      setProfileData({
        email: user.email || '',
        phone: user.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [user]);

  const handleProfilePictureUpdate = (updatedUser) => {
    onUserUpdate(updatedUser);
    setMessage('Profile picture updated successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setMessage('');

    try {
      const response = await axios.put(`${BASE_URL}/api/user/profile`, {
        email: profileData.email,
        phone: profileData.phone
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      onUserUpdate(response.data.user);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);

    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else {
        setMessage('Failed to update profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setMessage('');

    try {
      const response = await axios.put(`${BASE_URL}/api/user/password`, {
        current_password: profileData.currentPassword,
        password: profileData.newPassword,
        password_confirmation: profileData.confirmPassword
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setMessage('Password changed successfully!');
      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setTimeout(() => setMessage(''), 3000);

    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else {
        setMessage('Failed to change password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const validatePasswordForm = () => {
    const passwordErrors = {};
    
    if (profileData.newPassword && profileData.newPassword.length < 8) {
      passwordErrors.newPassword = 'Password must be at least 8 characters long.';
    }
    
    if (profileData.newPassword !== profileData.confirmPassword) {
      passwordErrors.confirmPassword = 'Passwords do not match.';
    }
    
    return passwordErrors;
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    const strengthTexts = ['', 'Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColors = ['', '#dc2626', '#f59e0b', '#eab308', '#84cc16', '#16a34a'];
    
    return {
      strength,
      text: strengthTexts[strength],
      color: strengthColors[strength]
    };
  };

  const passwordStrength = getPasswordStrength(profileData.newPassword);

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your account settings and preferences</p>
      </div>

      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="settings-tabs">
        <button
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Security
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'profile' && (
          <div className="tab-content">
            <div className="profile-picture-section">
              <h2>Profile Picture</h2>
              <ProfilePictureUpload
                user={user}
                onProfileUpdate={handleProfilePictureUpdate}
                token={token}
              />
            </div>

            <div className="profile-form-section">
              <h2>Profile Information</h2>
              <form onSubmit={handleProfileUpdate} className="settings-form">
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    required
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    className={`form-input ${errors.phone ? 'error' : ''}`}
                    placeholder="09XXXXXXXXX"
                  />
                  {errors.phone && <span className="error-text">{errors.phone}</span>}
                </div>

                <button
                  type="submit"
                  className="submit-button"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="tab-content">
            <div className="password-section">
              <h2>Change Password</h2>
              <form onSubmit={handlePasswordChange} className="settings-form">
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={profileData.currentPassword}
                    onChange={handleInputChange}
                    className={`form-input ${errors.current_password ? 'error' : ''}`}
                    required
                  />
                  {errors.current_password && (
                    <span className="error-text">{errors.current_password}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={profileData.newPassword}
                    onChange={handleInputChange}
                    className={`form-input ${errors.newPassword ? 'error' : ''}`}
                    required
                  />
                  {errors.newPassword && (
                    <span className="error-text">{errors.newPassword}</span>
                  )}
                  
                  {profileData.newPassword && (
                    <div className="password-strength">
                      <div className="strength-bar">
                        <div
                          className="strength-fill"
                          style={{
                            width: `${(passwordStrength.strength / 5) * 100}%`,
                            backgroundColor: passwordStrength.color
                          }}
                        ></div>
                      </div>
                      <span className="strength-text" style={{ color: passwordStrength.color }}>
                        {passwordStrength.text}
                      </span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={profileData.confirmPassword}
                    onChange={handleInputChange}
                    className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                    required
                  />
                  {errors.confirmPassword && (
                    <span className="error-text">{errors.confirmPassword}</span>
                  )}
                </div>

                <button
                  type="submit"
                  className="submit-button"
                  disabled={loading || !profileData.currentPassword || !profileData.newPassword}
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
