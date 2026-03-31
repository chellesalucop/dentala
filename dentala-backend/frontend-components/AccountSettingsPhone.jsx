import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AccountSettingsPhone.css';

const AccountSettingsPhone = ({ user, onUserUpdate, token }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});

  // Environment-based URL configuration
  const BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    if (user) {
      setPhone(user.phone || '');
    }
  }, [user]);

  const handlePhoneChange = (e) => {
    let value = e.target.value;
    
    // Only allow digits and limit to 11 digits
    value = value.replace(/\D/g, '').slice(0, 11);
    
    setPhone(value);
    
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
    
    // Phone validation
    if (!phone) {
      newErrors.phone = 'Phone number is required.';
    } else if (phone.length !== 11) {
      newErrors.phone = 'Phone number must be exactly 11 digits.';
    } else if (!/^(09|\+639)\d{9}$/.test(phone)) {
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
        phone: phone
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
      
      setMessage('Phone number updated successfully!');
      setTimeout(() => setMessage(''), 3000);

    } catch (error) {
      if (error.response?.status === 422) {
        const backendErrors = error.response.data.errors || {};
        setErrors(backendErrors);
      } else {
        setMessage('Failed to update phone number. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (user) {
      setPhone(user.phone || '');
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
    <div className="account-settings-phone">
      <div className="settings-header">
        <h2>Account Settings</h2>
        <p>Update your contact information</p>
      </div>

      <div className="user-identity">
        <div className="identity-item">
          <span className="identity-label">Email:</span>
          <span className="identity-value">{user?.email}</span>
        </div>
        <div className="identity-item">
          <span className="identity-label">Account Type:</span>
          <span className="identity-value">{user?.role === 'admin' ? 'Dentist' : 'Patient'}</span>
        </div>
      </div>

      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="phone-form">
        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={phone}
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
            Philippine mobile number (11 digits)
          </small>
          {phone && (
            <div className="phone-preview">
              <span className="preview-label">Preview:</span>
              <span className="preview-value">{formatPhoneNumber(phone)}</span>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="submit-button primary"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Phone Number'}
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
        <h3>Phone Number Validation</h3>
        <div className="phone-rules">
          <div className="rule-item">
            <span className="rule-icon">📱</span>
            <div className="rule-content">
              <strong>Required Format</strong>
              <ul>
                <li>Exactly 11 digits</li>
                <li>Philippine mobile numbers only</li>
                <li>Format: 09XX-XXX-XXXX or +639XX-XXX-XXXX</li>
                <li>Must be unique to your account</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="identity-note">
          <h4>Account Identity</h4>
          <p>
            Your account is primarily identified by your <strong>email address</strong> and <strong>phone number</strong>. 
            The name field is optional and used for display purposes only.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountSettingsPhone;
