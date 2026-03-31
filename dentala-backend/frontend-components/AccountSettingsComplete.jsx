import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AccountSettingsComplete.css';

const AccountSettingsComplete = ({ user, onUserUpdate, token }) => {
  const [formData, setFormData] = useState({
    email: '',
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
        email: user.email || '',
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
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required.';
    } else if (!/^[a-z0-9._%+-]+@(gmail\.com|yahoo\.com|tip\.edu\.ph)$/i.test(formData.email)) {
      newErrors.email = 'Please use a valid email (Gmail, Yahoo, or TIP only).';
    }
    
    // Phone validation
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required.';
    } else if (formData.phone.length !== 11) {
      newErrors.phone = 'Phone number must be exactly 11 digits.';
    } else if (!/^09[0-9]{9}$/.test(formData.phone)) {
      newErrors.phone = 'Please use a valid Philippine mobile format (09XXXXXXXXX).';
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
        email: formData.email,
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
        email: user.email || '',
        phone: user.phone || ''
      });
    }
    setErrors({});
    setMessage('');
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    
    // Format: 09XX-XXX-XXXX
    return phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1-$2-$3');
  };

  const getEmailDomain = (email) => {
    if (!email) return '';
    const domain = email.split('@')[1];
    return domain ? domain.toLowerCase() : '';
  };

  return (
    <div className="account-settings-complete">
      <div className="settings-header">
        <h2>Account Settings</h2>
        <p>Update your contact information</p>
      </div>

      <div className="user-identity">
        <div className="identity-item">
          <span className="identity-label">Account Type:</span>
          <span className="identity-value">{user?.role === 'admin' ? 'Dentist' : 'Patient'}</span>
        </div>
        <div className="identity-item">
          <span className="identity-label">User ID:</span>
          <span className="identity-value">#{user?.id}</span>
        </div>
      </div>

      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`form-input ${errors.email ? 'error' : ''}`}
            placeholder="your.email@gmail.com"
            disabled={loading}
          />
          {errors.email && (
            <span className="error-text">
              <span className="error-icon">⚠️</span>
              {errors.email}
            </span>
          )}
          <small className="help-text">
            Allowed domains: Gmail, Yahoo, or TIP (@tip.edu.ph)
          </small>
          {formData.email && (
            <div className="email-preview">
              <span className="preview-label">Domain:</span>
              <span className={`preview-value ${getEmailDomain(formData.email)}`}>
                {getEmailDomain(formData.email)}
              </span>
            </div>
          )}
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
            inputMode="tel"
            disabled={loading}
          />
          {errors.phone && (
            <span className="error-text">
              <span className="error-icon">⚠️</span>
              {errors.phone}
            </span>
          )}
          <small className="help-text">
            Philippine mobile number (exactly 11 digits, starts with 09)
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
        <h3>Data Integrity Guardrails</h3>
        <div className="rules-grid">
          <div className="rule-item">
            <span className="rule-icon">📧</span>
            <div className="rule-content">
              <strong>Email Validation</strong>
              <ul>
                <li>Required field</li>
                <li>Valid email format</li>
                <li>Allowed domains: Gmail, Yahoo, TIP</li>
                <li>Unique across all accounts</li>
                <li>Max 255 characters</li>
              </ul>
            </div>
          </div>
          
          <div className="rule-item">
            <span className="rule-icon">📱</span>
            <div className="rule-content">
              <strong>Phone Validation</strong>
              <ul>
                <li>Required field</li>
                <li>Exactly 11 digits</li>
                <li>Must start with "09"</li>
                <li>Philippine mobile format only</li>
                <li>Unique across all accounts</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="security-note">
          <h4>🛡️ Security Protection</h4>
          <p>
            Our system uses strict validation rules to prevent invalid data from entering the database. 
            Any attempt to submit invalid email formats or phone numbers will be blocked with a 
            <strong>422 Unprocessable Content</strong> response, protecting patient data integrity.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountSettingsComplete;
