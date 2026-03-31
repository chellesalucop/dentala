import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AccountSettings.css';

const AccountSettings = ({ user, onUserUpdate, token }) => {
  const [formData, setFormData] = useState({
    username: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});

  // Environment-based URL configuration
  const BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.name || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
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

  const handlePhoneChange = (e) => {
    let value = e.target.value;
    
    // Only allow digits and limit to 11 digits
    value = value.replace(/\D/g, '').slice(0, 11);
    
    setFormData(prev => ({
      ...prev,
      phone: value
    }));
    
    // Clear errors when user types
    if (errors.phone) {
      setErrors(prev => ({
        ...prev,
        phone: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required.';
    } else if (formData.username.length > 255) {
      newErrors.username = 'Username may not be greater than 255 characters.';
    }
    
    // Phone validation
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required.';
    } else if (formData.phone.length !== 11) {
      newErrors.phone = 'Phone number must be exactly 11 digits.';
    } else if (!/^(09|\+639)\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid Philippine mobile number.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const response = await axios.put(`${BASE_URL}/api/user/profile`, {
        username: formData.username,
        phone: formData.phone
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Update user context/parent component
      if (onUserUpdate) {
        onUserUpdate(response.data.user);
      }
      
      // Update localStorage
      localStorage.setItem('userData', JSON.stringify(response.data.user));
      
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);

    } catch (error) {
      if (error.response?.status === 422) {
        const backendErrors = error.response.data.errors || {};
        setErrors(backendErrors);
      } else {
        setMessage('Failed to update profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (user) {
      setFormData({
        username: user.name || '',
        phone: user.phone || ''
      });
    }
    setErrors({});
    setMessage('');
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    
    // Format: 09XX-XXX-XXXX or +639XX-XXX-XXXX
    if (phone.startsWith('09')) {
      return phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1-$2-$3');
    } else if (phone.startsWith('+639')) {
      return phone.replace(/(\+639)(\d{3})(\d{3})(\d{4})/, '$1-$2-$3-$4');
    }
    return phone;
  };

  return (
    <div className="account-settings">
      <div className="settings-header">
        <h2>Account Settings</h2>
        <p>Update your personal information</p>
      </div>

      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="account-form">
        <div className="form-group">
          <label htmlFor="username">Username (Name)</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            className={`form-input ${errors.username ? 'error' : ''}`}
            placeholder="Enter your full name"
            maxLength={255}
            disabled={loading}
          />
          {errors.username && (
            <span className="error-text">
              <span className="error-icon">⚠️</span>
              {errors.username}
            </span>
          )}
          <small className="help-text">
            This is your display name in the system
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handlePhoneChange}
            className={`form-input ${errors.phone ? 'error' : ''}`}
            placeholder="09XX-XXX-XXXX"
            maxLength={11}
            disabled={loading}
          />
          {errors.phone && (
            <span className="error-text">
              <span className="error-icon">⚠️</span>
              {errors.phone}
            </span>
          )}
          <small className="help-text">
            Philippine mobile number (11 digits)
          </small>
          {formData.phone && (
            <div className="phone-preview">
              <span className="preview-label">Preview:</span>
              <span className="preview-value">{formatPhoneNumber(formData.phone)}</span>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="submit-button primary"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
          
          <button
            type="button"
            onClick={handleReset}
            className="reset-button secondary"
            disabled={loading}
          >
            Reset
          </button>
        </div>
      </form>

      <div className="validation-info">
        <h3>Validation Rules:</h3>
        <div className="rules-grid">
          <div className="rule-item">
            <span className="rule-icon">👤</span>
            <div className="rule-content">
              <strong>Username</strong>
              <ul>
                <li>Required field</li>
                <li>Maximum 255 characters</li>
                <li>Letters, spaces, hyphens allowed</li>
              </ul>
            </div>
          </div>
          
          <div className="rule-item">
            <span className="rule-icon">📱</span>
            <div className="rule-content">
              <strong>Phone Number</strong>
              <ul>
                <li>Required field</li>
                <li>Exactly 11 digits</li>
                <li>Philippine mobile numbers only</li>
                <li>Format: 09XX-XXX-XXXX or +639XX-XXX-XXXX</li>
                <li>Must be unique to your account</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
