import React, { useState } from 'react';
import axios from 'axios';
import './PasswordChange.css';

const PasswordChange = ({ token }) => {
  const [formData, setFormData] = useState({
    current_password: '',
    password: '',
    password_confirmation: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirmation: false
  });

  // Environment-based URL configuration
  const BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

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

  const validateForm = () => {
    const newErrors = {};
    
    // Current password validation
    if (!formData.current_password) {
      newErrors.current_password = 'Current password is required.';
    }
    
    // New password validation
    if (!formData.password) {
      newErrors.password = 'New password is required.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'New password must be at least 8 characters long.';
    } else if (formData.password === formData.current_password) {
      newErrors.password = 'New password must be different from current password.';
    }
    
    // Password confirmation validation
    if (!formData.password_confirmation) {
      newErrors.password_confirmation = 'Password confirmation is required.';
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Passwords do not match.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: '', color: '' };
    
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    strength = Object.values(checks).filter(Boolean).length;
    
    const strengthLevels = {
      0: { text: 'Very Weak', color: '#ef4444' },
      1: { text: 'Weak', color: '#f97316' },
      2: { text: 'Fair', color: '#eab308' },
      3: { text: 'Good', color: '#84cc16' },
      4: { text: 'Strong', color: '#22c55e' },
      5: { text: 'Very Strong', color: '#059669' }
    };
    
    return {
      strength,
      text: strengthLevels[strength].text,
      color: strengthLevels[strength].color,
      checks
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const response = await axios.put(`${BASE_URL}/api/user/password`, {
        current_password: formData.current_password,
        password: formData.password,
        password_confirmation: formData.password_confirmation
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setMessage('Password updated successfully!');
      setTimeout(() => setMessage(''), 3000);
      
      // Reset form
      setFormData({
        current_password: '',
        password: '',
        password_confirmation: ''
      });
      setErrors({});

    } catch (error) {
      if (error.response?.status === 422) {
        const backendErrors = error.response.data.errors || {};
        const errorMessage = error.response.data.message || '';
        
        // 🛡️ PREVENT VALIDATION BLEED: Map backend messages to correct fields
        if (errorMessage.includes('current password')) {
          setErrors({
            current_password: 'The current password you entered is incorrect.'
          });
        } else if (errorMessage.includes('password must be at least')) {
          setErrors({
            password: 'The password must be at least 8 characters.'
          });
        } else if (errorMessage.includes('confirmation does not match')) {
          setErrors({
            password_confirmation: 'The password confirmation does not match.'
          });
        } else if (errorMessage.includes('current password field is required')) {
          setErrors({
            current_password: 'Current password is required.'
          });
        } else if (errorMessage.includes('password field is required')) {
          setErrors({
            password: 'New password is required.'
          });
        } else if (errorMessage.includes('password confirmation field is required')) {
          setErrors({
            password_confirmation: 'Password confirmation is required.'
          });
        } else {
          // Fallback to validation errors array
          setErrors(backendErrors);
        }
      } else {
        setMessage('Failed to update password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      current_password: '',
      password: '',
      password_confirmation: ''
    });
    setErrors({});
    setMessage('');
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="password-change">
      <div className="password-header">
        <h2>Change Password</h2>
        <p>Update your account password for enhanced security</p>
      </div>

      <div className="security-notice">
        <div className="notice-icon">🔒</div>
        <div className="notice-content">
          <h4>Security Notice</h4>
          <p>
            For your protection, you must verify your current password before setting a new one. 
            This prevents unauthorized access to your account.
          </p>
        </div>
      </div>

      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="password-form">
        <div className="form-group">
          <label htmlFor="current_password">Current Password</label>
          <div className="password-input-group">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              id="current_password"
              name="current_password"
              value={formData.current_password}
              onChange={handleInputChange}
              className={`form-input ${errors.current_password ? 'error' : ''}`}
              placeholder="Enter your current password"
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePasswordVisibility('current')}
              disabled={loading}
            >
              {showPasswords.current ? '🙈' : '👁️'}
            </button>
          </div>
          {errors.current_password && (
            <span className="error-text">
              <span className="error-icon">⚠️</span>
              {errors.current_password}
            </span>
          )}
          <small className="help-text">
            This proves you are the legitimate account owner
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="password">New Password</label>
          <div className="password-input-group">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="Enter your new password"
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePasswordVisibility('new')}
              disabled={loading}
            >
              {showPasswords.new ? '🙈' : '👁️'}
            </button>
          </div>
          {errors.password && (
            <span className="error-text">
              <span className="error-icon">⚠️</span>
              {errors.password}
            </span>
          )}
          
          {formData.password && (
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
          
          <small className="help-text">
            Minimum 8 characters. Use a mix of letters, numbers, and symbols for better security.
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="password_confirmation">Confirm New Password</label>
          <div className="password-input-group">
            <input
              type={showPasswords.confirmation ? 'text' : 'password'}
              id="password_confirmation"
              name="password_confirmation"
              value={formData.password_confirmation}
              onChange={handleInputChange}
              className={`form-input ${errors.password_confirmation ? 'error' : ''}`}
              placeholder="Confirm your new password"
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePasswordVisibility('confirmation')}
              disabled={loading}
            >
              {showPasswords.confirmation ? '🙈' : '👁️'}
            </button>
          </div>
          {errors.password_confirmation && (
            <span className="error-text">
              <span className="error-icon">⚠️</span>
              {errors.password_confirmation}
            </span>
          )}
          <small className="help-text">
            Re-enter your new password to prevent typos
          </small>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="submit-button primary"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Password'}
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

      <div className="password-requirements">
        <h4>Password Requirements</h4>
        <div className="requirements-grid">
          <div className={`requirement ${passwordStrength.checks?.length ? 'met' : 'unmet'}`}>
            <span className="requirement-icon">{passwordStrength.checks?.length ? '✅' : '❌'}</span>
            <span>At least 8 characters long</span>
          </div>
          <div className={`requirement ${passwordStrength.checks?.lowercase ? 'met' : 'unmet'}`}>
            <span className="requirement-icon">{passwordStrength.checks?.lowercase ? '✅' : '❌'}</span>
            <span>Contains lowercase letters</span>
          </div>
          <div className={`requirement ${passwordStrength.checks?.uppercase ? 'met' : 'unmet'}`}>
            <span className="requirement-icon">{passwordStrength.checks?.uppercase ? '✅' : '❌'}</span>
            <span>Contains uppercase letters</span>
          </div>
          <div className={`requirement ${passwordStrength.checks?.numbers ? 'met' : 'unmet'}`}>
            <span className="requirement-icon">{passwordStrength.checks?.numbers ? '✅' : '❌'}</span>
            <span>Contains numbers</span>
          </div>
          <div className={`requirement ${passwordStrength.checks?.special ? 'met' : 'unmet'}`}>
            <span className="requirement-icon">{passwordStrength.checks?.special ? '✅' : '❌'}</span>
            <span>Contains special characters</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordChange;
