import React, { useState, useRef } from 'react';
import axios from 'axios';

const ProfilePictureUpload = ({ user, onProfileUpdate, token }) => {
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Environment-based URL configuration
  const BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

  const getImageUrl = (path) => {
    if (!path) return '/default-avatar.png';
    return `${BASE_URL}/storage/${path}`;
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    
    if (!file) return;
    
    setError('');
    
    // 1. Frontend file size validation (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      setError(`File is too large! Please select an image under 2MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }
    
    // 2. Frontend file type validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type! Please select a JPEG, PNG, or GIF image.');
      return;
    }
    
    // 3. Instant preview using createObjectURL for zero-latency UI
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    
    // 4. Upload to backend
    await handleUpload(file, previewUrl);
  };

  const handleUpload = async (file, previewUrl) => {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      setUploading(true);
      setUploadProgress(0);
      
      const response = await axios.post(`${BASE_URL}/api/user/profile-picture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        }
      });
      
      // 5. Update UI and localStorage
      const newProfileUrl = response.data.url;
      setProfilePicture(newProfileUrl);
      
      // Store in localStorage for header persistence
      localStorage.setItem('userProfilePicture', newProfileUrl);
      localStorage.setItem('userProfilePath', response.data.user.profile_photo_path);
      
      // 6. Update user context/parent component
      if (onProfileUpdate) {
        onProfileUpdate(response.data.user);
      }
      
      // 7. Clean up preview URL
      URL.revokeObjectURL(previewUrl);
      
      // 8. Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Upload failed:', error);
      
      // Enhanced error handling
      if (error.response?.status === 422) {
        const errors = error.response.data.errors;
        if (errors.image) {
          setError(errors.image.join('\n'));
        } else {
          setError('Validation failed. Please check your file and try again.');
        }
      } else if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (error.response?.status === 413) {
        setError('File too large. Please select an image under 2MB.');
      } else {
        setError('Upload failed. Please try again later.');
      }
      
      // Reset preview on error
      setPreview(null);
      URL.revokeObjectURL(previewUrl);
      
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveProfilePicture = async () => {
    try {
      setUploading(true);
      
      // Upload a default/empty image or call a delete endpoint
      // For now, we'll set to null by uploading a placeholder
      const response = await axios.delete(`${BASE_URL}/api/user/profile-picture`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Update UI
      setProfilePicture(null);
      localStorage.removeItem('userProfilePicture');
      localStorage.removeItem('userProfilePath');
      
      if (onProfileUpdate) {
        onProfileUpdate(response.data.user);
      }
      
    } catch (error) {
      console.error('Remove failed:', error);
      setError('Failed to remove profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const setProfilePicture = (url) => {
    // This would update the parent component's state
    // Implementation depends on your state management
    console.log('Profile picture updated:', url);
  };

  return (
    <div className="profile-picture-upload">
      <div className="profile-picture-container">
        <div className="profile-image-wrapper">
          <img 
            src={preview || getImageUrl(user?.profile_photo_path)} 
            alt="Profile" 
            className="profile-image"
            onError={(e) => {
              e.target.src = '/default-avatar.png';
            }}
          />
          
          {uploading && (
            <div className="upload-overlay">
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{uploadProgress}%</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="profile-controls">
          <input
            ref={fileInputRef}
            type="file"
            id="profile-picture-input"
            onChange={handleFileSelect}
            accept="image/jpeg,image/png,image/jpg,image/gif"
            style={{ display: 'none' }}
            disabled={uploading}
          />
          
          <label 
            htmlFor="profile-picture-input" 
            className={`upload-button ${uploading ? 'disabled' : ''}`}
          >
            {uploading ? 'Uploading...' : 'Change Photo'}
          </label>
          
          {user?.profile_photo_path && !uploading && (
            <button 
              onClick={handleRemoveProfilePicture}
              className="remove-button"
              type="button"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
          <button 
            onClick={() => setError('')}
            className="error-close"
            type="button"
          >
            ×
          </button>
        </div>
      )}
      
      <div className="upload-guidelines">
        <h4>Photo Guidelines:</h4>
        <ul>
          <li>Maximum file size: 2MB</li>
          <li>Accepted formats: JPEG, PNG, GIF</li>
          <li>Recommended size: 200x200 pixels</li>
          <li>Clear, recent photo preferred</li>
        </ul>
      </div>
    </div>
  );
};

export default ProfilePictureUpload;
