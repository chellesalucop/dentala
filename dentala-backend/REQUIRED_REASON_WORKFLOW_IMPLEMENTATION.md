# Required Reason Workflow Implementation Guide

## Backend Status: ✅ COMPLETE

The backend is fully prepared for the Required Reason Workflow:

### 1. Database Schema
- ✅ `cancellation_reason` column exists in `appointments` table
- ✅ Column type: TEXT, nullable
- ✅ Included in Appointment model `$fillable` array

### 2. Patient-Side Cancellation (Updated)
**File:** `app/Http/Controllers/Api/AppointmentController.php`
**Method:** `cancel()`

```php
public function cancel(Request $request, $id)
{
    // 🛡️ VALIDATION: Require cancellation reason for patient cancellations
    $request->validate([
        'cancellation_reason' => 'required|string|max:500'
    ], [
        'cancellation_reason.required' => 'Please provide a reason for cancellation.'
    ]);

    $appointment = Appointment::where('id', $id)
        ->where('user_id', $request->user()->id)
        ->firstOrFail();

    $appointment->status = 'cancelled';
    $appointment->cancellation_reason = $request->cancellation_reason;
    $appointment->save();

    return response()->json(['message' => 'Appointment cancelled successfully.']);
}
```

### 3. Admin-Side Status Updates (Already Complete)
**File:** `app/Http/Controllers/Api/AppointmentController.php`
**Method:** `updateStatus()`

```php
// 🛡️ CANCELLATION REASON: Save reason when status is cancelled
if ($request->status === 'cancelled') {
    $appointment->cancellation_reason = $request->cancellation_reason;
} else {
    // Clear reason if status is not cancelled (data hygiene)
    $appointment->cancellation_reason = null;
}
```

### 4. API Endpoints Ready
- ✅ `PATCH /api/appointments/{id}/status` - Admin status updates
- ✅ `POST /api/appointments/{id}/cancel` - Patient cancellations
- ✅ Both endpoints include `cancellation_reason` in responses

---

## Frontend Implementation Required

### 1. Patient-Side: MyAppointmentsPage.jsx

**Location:** Find the cancellation button/handler in your MyAppointmentsPage.jsx

**Current Implementation (Likely):**
```javascript
const handleCancel = (appointmentId) => {
  if (window.confirm('Are you sure you want to cancel this appointment?')) {
    axios.patch(`/api/appointments/${appointmentId}/cancel`, {
      status: 'cancelled'
    })
    .then(response => {
      showAlert('Appointment cancelled successfully!', 'success');
      fetchAppointments();
    })
    .catch(error => {
      showAlert('Failed to cancel appointment', 'error');
    });
  }
};
```

**Required Implementation:**
```javascript
const handleCancel = (appointmentId) => {
  // 🛡️ PROMPT FOR REASON: Require user input before cancellation
  const reason = window.prompt('Please provide a reason for cancellation:');
  
  // Validation: Check if reason is empty
  if (!reason || reason.trim() === '') {
    showAlert('Please provide a reason for cancellation.', 'error');
    return;
  }
  
  // Validation: Check if reason is too short
  if (reason.trim().length < 3) {
    showAlert('Please provide a more detailed reason (at least 3 characters).', 'error');
    return;
  }

  // Confirmation with reason
  if (window.confirm(`Are you sure you want to cancel this appointment?\n\nReason: ${reason}`)) {
    axios.patch(`/api/appointments/${appointmentId}/cancel`, {
      status: 'cancelled',
      cancellation_reason: reason.trim()
    })
    .then(response => {
      showAlert('Appointment cancelled successfully!', 'success');
      fetchAppointments();
    })
    .catch(error => {
      if (error.response?.status === 422) {
        // Handle validation errors from backend
        const errors = error.response.data.errors;
        if (errors.cancellation_reason) {
          showAlert(errors.cancellation_reason[0], 'error');
        } else {
          showAlert('Failed to cancel appointment', 'error');
        }
      } else {
        showAlert('Failed to cancel appointment', 'error');
      }
    });
  }
};
```

### 2. Admin-Side: AdminAppointmentsPage.jsx

**Location:** Find the "Patient Information" modal (around line 245)

**Required Addition:**
```javascript
{/* 🛡️ ADMIN AUDIT: Only shows if the patient or admin cancelled the appointment */}
{selectedAppointment.status === 'cancelled' && (
  <section className="pt-6 border-t border-red-100 bg-red-50 p-4 rounded-xl mt-4">
    <div className="flex items-center gap-2 mb-2">
      <AlertCircle size={16} className="text-red-600" />
      <h3 className="text-xs uppercase text-red-600 font-bold tracking-[0.2em]">
        Reason for Cancellation
      </h3>
    </div>
    <p className="text-gray-800 italic text-sm pl-6">
      "{selectedAppointment.cancellation_reason || 'No specific reason provided.'}"
    </p>
  </section>
)}
```

**Import Required:** Add AlertCircle to your imports
```javascript
import { AlertCircle } from 'lucide-react';
```

### 3. Admin Cancellation with Reason (Optional Enhancement)

If you want to allow admins to provide cancellation reasons when updating status:

**Current Admin Status Update (Likely):**
```javascript
const handleStatusUpdate = (appointmentId, newStatus) => {
  axios.patch(`/api/admin/appointments/${appointmentId}/status`, {
    status: newStatus
  })
  .then(response => {
    showAlert(`Appointment marked as ${newStatus}`, 'success');
    fetchAppointments();
  });
};
```

**Enhanced Implementation:**
```javascript
const handleStatusUpdate = (appointmentId, newStatus) => {
  let reason = null;
  
  // 🛡️ REQUIRE REASON FOR CANCELLATIONS: Prompt admin for reason
  if (newStatus === 'cancelled') {
    reason = window.prompt('Please provide a reason for cancellation:');
    
    if (!reason || reason.trim() === '') {
      showAlert('Please provide a reason for cancellation.', 'error');
      return;
    }
    
    if (reason.trim().length < 3) {
      showAlert('Please provide a more detailed reason (at least 3 characters).', 'error');
      return;
    }
    
    reason = reason.trim();
  }

  axios.patch(`/api/admin/appointments/${appointmentId}/status`, {
    status: newStatus,
    cancellation_reason: reason
  })
  .then(response => {
    showAlert(`Appointment marked as ${newStatus}`, 'success');
    fetchAppointments();
  })
  .catch(error => {
    if (error.response?.status === 422) {
      const errors = error.response.data.errors;
      if (errors.cancellation_reason) {
        showAlert(errors.cancellation_reason[0], 'error');
      } else {
        showAlert('Failed to update appointment status', 'error');
      }
    } else {
      showAlert('Failed to update appointment status', 'error');
    }
  });
};
```

---

## Testing Checklist

### Patient-Side Testing:
- [ ] Cancel without reason → Shows error message
- [ ] Cancel with empty reason → Shows error message  
- [ ] Cancel with short reason (< 3 chars) → Shows error message
- [ ] Cancel with valid reason → Success
- [ ] Check if reason appears in admin view

### Admin-Side Testing:
- [ ] View cancelled appointment → Shows reason section
- [ ] Appointment without reason → Shows "No specific reason provided"
- [ ] Admin cancellation with reason → Works correctly
- [ ] Admin cancellation without reason → Shows error

### Data Flow Verification:
- [ ] Patient cancellation reason saved to database
- [ ] Admin can view patient cancellation reasons
- [ ] Admin cancellation reasons also saved
- [ ] API responses include cancellation_reason field

---

## API Response Examples

### Successful Patient Cancellation:
```json
{
  "message": "Appointment cancelled successfully."
}
```

### Validation Error (Missing Reason):
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "cancellation_reason": [
      "Please provide a reason for cancellation."
    ]
  }
}
```

### Admin Index Response (Includes cancellation_reason):
```json
{
  "id": 1,
  "status": "cancelled",
  "cancellation_reason": "Patient had emergency at work",
  "full_name": "Katherine Johnson",
  "appointment_date": "2026-03-30",
  "preferred_time": "03:00 PM"
}
```

---

## Benefits of This Implementation

1. **Audit Trail:** Complete record of why appointments were cancelled
2. **Patient Communication:** Clear reasons help improve service
3. **Business Analytics:** Track cancellation patterns for optimization
4. **Professional Service:** Turns simple cancellations into meaningful feedback
5. **Data Quality:** Ensures every cancellation has context

---

## Migration Status

- ✅ Backend: Complete
- ⏳ Frontend: Requires implementation in MyAppointmentsPage.jsx and AdminAppointmentsPage.jsx
- ✅ Database: Ready
- ✅ API: Ready

The backend is fully prepared. Implement the frontend changes to complete the Required Reason Workflow.
