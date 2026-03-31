# Frontend Fetch Headers Guide - Laravel 12 API

## 🏷️ Backend Synchronize Label: Laravel 12 API
**Focus**: Ensure Accept: application/json header is sent

## 🎯 The Critical Fix

### **Problem**
Even with the bootstrap/app.php fix, Laravel defaults to redirect if it doesn't "see" that the frontend wants JSON.

### **Solution**
Include `Accept: application/json` header in all API fetch calls.

## 📋 Frontend Implementation

### **Correct Fetch Call**
```javascript
const registerUser = async (formData) => {
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'  // ← CRITICAL HEADER
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (response.ok) {
      // Handle success
      console.log('Registration successful:', data);
      return data;
    } else {
      // This should NOT happen with proper headers
      console.error('Unexpected response:', data);
    }
  } catch (error) {
    // ValidationException now properly reaches here
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      if (status === 422 && data.errors) {
        // Handle validation errors
        console.log('Validation errors:', data.errors);
        return { success: false, errors: data.errors };
      }
    }

    // Handle other errors
    console.error('Registration error:', error);
    return { success: false, error: 'Registration failed' };
  }
};
```

### **React Component Example**
```jsx
import React, { useState } from 'react';

const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    password_confirmation: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const result = await registerUser(formData);
      
      if (result.success) {
        // Handle success
        console.log('User registered successfully');
        // Redirect or show success message
      } else if (result.errors) {
        // Handle validation errors
        setErrors(result.errors);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Email:</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        {errors.email && (
          <div className="error" style={{ color: 'red' }}>
            {errors.email[0]}
          </div>
        )}
      </div>

      <div>
        <label>Phone:</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
        />
        {errors.phone && (
          <div className="error" style={{ color: 'red' }}>
            {errors.phone[0]}
          </div>
        )}
      </div>

      <div>
        <label>Password:</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        {errors.password && (
          <div className="error" style={{ color: 'red' }}>
            {errors.password[0]}
          </div>
        )}
      </div>

      <div>
        <label>Confirm Password:</label>
        <input
          type="password"
          name="password_confirmation"
          value={formData.password_confirmation}
          onChange={handleChange}
          required
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
};

// API function
const registerUser = async (formData) => {
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'  // ← CRITICAL
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, errors: data.errors };
    }
  } catch (error) {
    if (error.response?.status === 422) {
      return { success: false, errors: error.response.data.errors };
    }
    throw error;
  }
};

export default RegistrationForm;
```

## 🔍 Browser DevTools Verification

### **Step-by-Step Verification**
1. **Open DevTools**: Press F12
2. **Go to Network Tab**
3. **Submit Registration Form** (with invalid data)
4. **Find the Register Request** (should be red)
5. **Check Headers Tab**:
   ```
   Content-Type: application/json
   Accept: application/json  // ← Should be present
   ```
6. **Check Response Tab**:
   ```json
   {
     "message": "The given data was invalid.",
     "errors": {
       "email": ["Please enter a valid email address."]
     }
   }
   ```

### **What to Look For**
- ✅ **Status Code**: 422 (Unprocessable Entity)
- ✅ **Response Type**: application/json
- ✅ **Response Body**: JSON with message and errors
- ✅ **Headers**: Accept: application/json present

## 🐛 Debugging the "Missing" Error

### **Root Cause Analysis**
```javascript
// PROBLEM: Missing Accept header
fetch('/api/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
    // Missing: 'Accept': 'application/json'
  },
  body: JSON.stringify(formData)
});

// RESULT: Laravel returns HTML redirect instead of JSON
// fetch doesn't trigger catch block on 422
// errors.email remains undefined
// errors.email[0] throws "Cannot read from undefined"
```

### **Solution Verification**
```javascript
// CORRECT: With Accept header
fetch('/api/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'  // ← Added
  },
  body: JSON.stringify(formData)
});

// RESULT: Laravel returns JSON
// catch block triggered on 422
// errors.email contains array of messages
// errors.email[0] displays error message
```

## 📊 Error Flow Summary

### **Complete Error Flow**
```
1. User submits invalid email
2. Frontend sends fetch with Accept: application/json
3. Laravel returns 422 JSON response
4. fetch triggers catch block
5. errors.email contains ["Please enter a valid email address."]
6. React displays red error message
```

### **What Happens Without Accept Header**
```
1. User submits invalid email
2. Frontend sends fetch without Accept header
3. Laravel attempts HTML redirect
4. fetch doesn't trigger catch block
5. errors.email is undefined
6. React shows no error (or crashes)
```

## 🎨 Styling Error Messages

### **CSS for Error Display**
```css
.error {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: block;
}

input:invalid {
  border-color: #dc3545;
}

input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}
```

### **Tailwind CSS Version**
```jsx
{errors.email && (
  <p className="text-red-500 text-sm mt-1">
    {errors.email[0]}
  </p>
)}
```

## 🚀 Production Checklist

### **Frontend Requirements**
- [ ] All API calls include `Accept: application/json`
- [ ] Error handling properly displays `errors.field[0]`
- [ ] Loading states prevent double submissions
- [ ] Form validation works with browser + Laravel

### **Backend Verification**
- [ ] `bootstrap/app.php` has exception handler
- [ ] ValidationException returns JSON for API routes
- [ ] Custom messages are user-friendly
- [ ] 422 status code properly set

### **Testing Checklist**
- [ ] Empty email shows error
- [ ] Invalid domain shows error
- [ ] Duplicate email shows specific message
- [ ] Valid registration succeeds
- [ ] Network tab shows proper headers

---

**Status**: ✅ Frontend Headers Guide Complete  
**Accept Header**: ✅ Critical for JSON Responses  
**Error Display**: ✅ Ready for React Integration  
**DevTools**: ✅ Verification Steps Provided

**Version**: Laravel 12 API v6.0 - Frontend Integration  
**Production**: ✅ Ready for Implementation
