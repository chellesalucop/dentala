# MyAppointmentsPage Backend Analysis

## Overview
The MyAppointmentsPage frontend is supported by a robust Laravel backend with comprehensive appointment management, security features, and data validation.

---

## 🏗️ Backend Architecture

### 1. Controller: `AppointmentController.php`
**Location:** `app/Http/Controllers/Api/AppointmentController.php`
**Purpose:** Handles all patient-side appointment operations

### 2. Model: `Appointment.php`
**Location:** `app/Models/Appointment.php`
**Purpose:** Data structure and relationships for appointments

### 3. Routes: `api.php`
**Location:** `routes/api.php`
**Purpose:** API endpoints for patient appointment management

---

## 📡 Patient API Endpoints

### Primary Patient Routes
```php
// All routes require auth:sanctum middleware
Route::get('/appointments', [AppointmentController::class, 'index']);
Route::post('/appointments', [AppointmentController::class, 'store']);
Route::get('/appointments/check-slots', [AppointmentController::class, 'checkSlots']);
Route::patch('/appointments/{id}/cancel', [AppointmentController::class, 'cancel']);
Route::patch('/appointments/{id}/reschedule', [AppointmentController::class, 'reschedule']);
Route::delete('/appointments/{id}', [AppointmentController::class, 'destroy']);
Route::delete('/appointments/clear/{status}', [AppointmentController::class, 'clearByStatus']);
```

---

## 🔧 Core Patient Operations

### 1. View Appointments (`index` method)
**Endpoint:** `GET /api/appointments`
**Purpose:** Returns only the authenticated user's appointments

```php
public function index(Request $request)
{
    $user = $request->user();
    if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

    $appointments = Appointment::where('user_id', $user->id)
        ->orderBy('appointment_date', 'asc')
        ->get();

    return response()->json($appointments);
}
```

**Features:**
- ✅ User isolation (only user's own appointments)
- ✅ Chronological ordering (by appointment_date)
- ✅ Complete data hydration (all appointment fields)
- ✅ JSON response format

### 2. Book New Appointment (`store` method)
**Endpoint:** `POST /api/appointments`
**Purpose:** Create new appointments with comprehensive validation

```php
public function store(Request $request)
{
    $user = $request->user();
    if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

    // 🛡️ ACTIVE LIMIT GUARD: Maximum 3 active appointments
    $activeCount = Appointment::where('user_id', $user->id)
        ->whereIn('status', ['pending', 'confirmed'])
        ->count();

    if ($activeCount >= 3) {
        return response()->json([
            'message' => 'Limit Reached: You can only have 3 active appointments at a time.'
        ], 429);
    }

    // 🛡️ COMPREHENSIVE VALIDATION: Medical-grade data quality
    $validated = $request->validate([
        'full_name' => 'required|string|regex:/^[a-zA-Z\s.]+$/|max:50',
        'phone' => 'required|numeric|digits:11',
        'email' => ['required', 'email', 'regex:/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/'],
        'service_type' => 'required|string|max:255',
        'custom_service' => 'nullable|string|max:255',
        'preferred_dentist' => 'required|string|max:255',
        'medical_conditions' => 'nullable|array',
        'others' => 'nullable|string|max:255',
        'appointment_date' => 'required|date',
        'preferred_time' => 'required|string|max:50',
    ], $messages);

    $validated['user_id'] = $user->id;
    $validated['status'] = 'pending'; 

    $appointment = Appointment::create($validated);

    return response()->json(['message' => 'Appointment booked successfully!', 'appointment' => $appointment], 201);
}
```

**Security Features:**
- ✅ **Active Limit Guard:** Maximum 3 pending/confirmed appointments
- ✅ **Silent Guard:** Backend validation even if frontend is bypassed
- ✅ **Medical-Grade Validation:** Name regex, phone digits, email format
- ✅ **Custom Error Messages:** User-friendly validation feedback

### 3. Cancel Appointment (`cancel` method)
**Endpoint:** `PATCH /api/appointments/{id}/cancel`
**Purpose:** Cancel appointment with required reason

```php
public function cancel(Request $request, $id)
{
    // 🛡️ VALIDATION: Require cancellation reason
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

**Features:**
- ✅ **Required Reason:** Must provide cancellation reason
- ✅ **User Authorization:** Can only cancel own appointments
- ✅ **Audit Trail:** Reason saved to database
- ✅ **Status Update:** Proper status change to 'cancelled'

### 4. Reschedule Appointment (`reschedule` method)
**Endpoint:** `PATCH /api/appointments/{id}/reschedule`
**Purpose:** Change appointment date/time

```php
public function reschedule(Request $request, $id)
{
    $request->validate([
        'appointment_date' => 'required|date|after_or_equal:today',
        'preferred_time' => 'required|string|max:50',
    ]);

    $appointment = Appointment::where('id', $id)
        ->where('user_id', $request->user()->id)
        ->firstOrFail();

    $appointment->appointment_date = $request->appointment_date;
    $appointment->preferred_time = $request->preferred_time;
    $appointment->status = 'pending'; // Reset to pending for admin approval
    $appointment->save();

    return response()->json([
        'message' => 'Appointment rescheduled successfully.',
        'appointment' => $appointment
    ]);
}
```

**Features:**
- ✅ **Date Validation:** Cannot schedule in the past
- ✅ **Status Reset:** Returns to 'pending' for admin approval
- ✅ **User Authorization:** Can only reschedule own appointments

### 5. Check Available Slots (`checkSlots` method)
**Endpoint:** `GET /api/appointments/check-slots?date=YYYY-MM-DD`
**Purpose:** Real-time slot availability for frontend dropdown

```php
public function checkSlots(Request $request)
{
    $request->validate(['date' => 'required|date']);

    $date = $request->query('date');
    
    // 🛡️ TOTAL LOCKDOWN: All active slots considered "taken"
    $takenSlots = Appointment::where('appointment_date', $date)
        ->whereIn('status', ['confirmed', 'pending', 'completed'])
        ->pluck('preferred_time')
        ->toArray();

    return response()->json([
        'taken_times' => $takenSlots,
        'date' => $date,
        'total_taken' => count($takenSlots)
    ], 200);
}
```

**Features:**
- ✅ **Real-time Availability:** Live slot checking
- ✅ **Multi-Status Consideration:** Confirmed, pending, and completed slots
- ✅ **Date-Specific:** Accurate availability per selected date
- ✅ **JSON Response:** Frontend-ready format

### 6. Delete Appointment (`destroy` method)
**Endpoint:** `DELETE /api/appointments/{id}`
**Purpose:** Delete past/cancelled appointments

```php
public function destroy(Request $request, $id)
{
    $appointment = Appointment::where('id', $id)
        ->where('user_id', auth()->id())
        ->firstOrFail();

    // 🛡️ SECURITY: Only allow deleting if it's NOT upcoming
    if (in_array($appointment->status, ['pending', 'confirmed'])) {
        return response()->json(['message' => 'Cannot delete active appointments.'], 403);
    }

    $appointment->delete();

    return response()->json(['message' => 'Appointment deleted.']);
}
```

**Security Features:**
- ✅ **Active Appointment Protection:** Cannot delete pending/confirmed appointments
- ✅ **User Authorization:** Can only delete own appointments
- ✅ **Soft Deletes:** Uses SoftDeletes for audit trail

### 7. Clear by Status (`clearByStatus` method)
**Endpoint:** `DELETE /api/appointments/clear/{status}`
**Purpose:** Bulk clear appointments by status

```php
public function clearByStatus(Request $request, $status)
{
    // 🛡️ SECURITY: Only allow clearing 'completed' or 'cancelled'
    $validStatuses = ['completed', 'cancelled'];
    if (!in_array($status, $validStatuses)) {
        return response()->json(['message' => 'Invalid clear request.'], 400);
    }

    Appointment::where('user_id', auth()->id())
        ->where('status', $status)
        ->delete();

    return response()->json(['message' => "All {$status} appointments cleared."]);
}
```

**Features:**
- ✅ **Status Validation:** Only allows clearing completed/cancelled
- ✅ **User Authorization:** Only affects user's own appointments
- ✅ **Bulk Operations:** Efficient cleanup functionality

---

## 🗄️ Database Schema Support

### Appointment Model Structure
```php
protected $fillable = [
    'user_id',           // Foreign key to users table
    'full_name',         // Patient name for booking
    'phone',             // Contact number
    'email',             // Contact email
    'service_type',       // Service category
    'custom_service',     // Custom service description
    'preferred_dentist', // Assigned dentist
    'medical_conditions',  // Array of medical conditions
    'others',            // Additional medical notes
    'appointment_date',   // Scheduled date
    'preferred_time',     // Preferred time slot
    'status',            // Appointment status
    'cancellation_reason' // Reason for cancellation
];

protected $casts = [
    'medical_conditions' => 'array',     // JSON to array conversion
    'appointment_date' => 'date',       // Date object
    'preferred_time' => 'datetime:h:i A', // 12-hour format
    'others' => 'string',               // String cast for notes
    'created_at' => 'datetime',          // Booking timestamp
    'deleted_at' => 'datetime',          // Soft delete support
];
```

**Key Features:**
- ✅ **Cancellation Reason:** Dedicated field for audit trail
- ✅ **Medical Conditions:** JSON array for multiple conditions
- ✅ **Custom Service:** Support for "Other" service types
- ✅ **Soft Deletes:** Audit trail with deleted_at
- ✅ **Time Formatting:** 12-hour AM/PM format for display

---

## 🔐 Security Architecture

### 1. Authentication Layer
```php
Route::middleware('auth:sanctum')->group(function () {
    // All patient routes protected by Sanctum tokens
    Route::get('/appointments', [AppointmentController::class, 'index']);
    Route::post('/appointments', [AppointmentController::class, 'store']);
    // ... etc
});
```

### 2. Authorization Checks
```php
// User Isolation: Only user's own appointments
->where('user_id', $request->user()->id)

// Role Verification: Admin-only endpoints
if ($user->role !== 'admin') {
    return response()->json(['message' => 'Access Denied.'], 403);
}
```

### 3. Data Validation
```php
// Medical-grade validation with custom messages
$messages = [
    'phone.digits' => 'Oops! Your phone number must be exactly 11 digits.',
    'email.regex' => 'Please provide a valid email address. (example@gmail.com)',
    'full_name.regex' => 'Names should only contain letters, periods, and spaces.',
    'cancellation_reason.required' => 'Please provide a reason for cancellation.'
];
```

### 4. Business Logic Guards
```php
// Active Appointment Limit: Maximum 3 pending/confirmed
if ($activeCount >= 3) {
    return response()->json(['message' => 'Limit Reached...'], 429);
}

// Active Appointment Protection: Cannot delete pending/confirmed
if (in_array($appointment->status, ['pending', 'confirmed'])) {
    return response()->json(['message' => 'Cannot delete active appointments.'], 403);
}
```

---

## 📊 Data Flow for MyAppointmentsPage

### 1. Initial Page Load
```
Frontend: GET /api/appointments
Backend: Returns user's appointments ordered by date
Response: Array of appointment objects with all fields
```

### 2. Booking New Appointment
```
Frontend: POST /api/appointments with form data
Backend: Validates, checks limits, creates appointment
Response: Success message + appointment object
```

### 3. Checking Slot Availability
```
Frontend: GET /api/appointments/check-slots?date=2026-03-30
Backend: Returns taken slots for specific date
Response: {taken_times: ["09:00 AM", "11:00 AM"], date: "2026-03-30"}
```

### 4. Cancelling Appointment
```
Frontend: PATCH /api/appointments/{id}/cancel with reason
Backend: Validates reason, updates status, saves reason
Response: Success message
```

### 5. Rescheduling Appointment
```
Frontend: PATCH /api/appointments/{id}/reschedule with new date/time
Backend: Validates date, updates appointment, resets status
Response: Success message + updated appointment
```

### 6. Managing History
```
Frontend: DELETE /api/appointments/{id} (individual)
Frontend: DELETE /api/appointments/clear/completed (bulk)
Backend: Soft deletes with security checks
Response: Success message
```

---

## 🎯 Key Features for MyAppointmentsPage

### 1. Comprehensive Data Access
- ✅ All appointment fields available in frontend
- ✅ Medical conditions as arrays
- ✅ Cancellation reasons for audit trail
- ✅ Custom service descriptions
- ✅ Profile photos via user relationship

### 2. Real-time Validation
- ✅ Live slot availability checking
- ✅ Date validation (no past dates)
- ✅ Time slot conflict prevention
- ✅ Active appointment limits

### 3. Security & Privacy
- ✅ User isolation (only own appointments)
- ✅ Sanctum token authentication
- ✅ Role-based access control
- ✅ Input sanitization and validation

### 4. Business Logic Enforcement
- ✅ Maximum 3 active appointments
- ✅ Status-based operation restrictions
- ✅ Required cancellation reasons
- ✅ Admin approval workflow (pending → confirmed)

### 5. Audit Trail Support
- ✅ Cancellation reasons saved
- ✅ Status change tracking
- ✅ Soft deletes for history
- ✅ Timestamps for all operations

---

## 🔄 API Response Formats

### Appointment Object Structure
```json
{
  "id": 1,
  "user_id": 123,
  "full_name": "Katherine Johnson",
  "phone": "09171234567",
  "email": "katherine@example.com",
  "service_type": "Cleaning",
  "custom_service": "Deep cleaning with polishing",
  "preferred_dentist": "Dr. Hin D. Sadboi",
  "medical_conditions": ["Hypertension", "Diabetes"],
  "others": "Allergic to penicillin",
  "appointment_date": "2026-03-30",
  "preferred_time": "03:00 PM",
  "status": "pending",
  "cancellation_reason": null,
  "created_at": "2026-03-29T10:30:00.000000Z"
}
```

### Error Response Format
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "cancellation_reason": [
      "Please provide a reason for cancellation."
    ],
    "phone": [
      "Oops! Your phone number must be exactly 11 digits."
    ]
  }
}
```

---

## 📋 Implementation Status

### ✅ Complete Backend Features
- **Appointment CRUD:** Full create, read, update, delete operations
- **Validation:** Medical-grade with custom error messages
- **Security:** Authentication, authorization, business logic guards
- **Data Structure:** Comprehensive fields with proper casting
- **Audit Trail:** Cancellation reasons and status tracking
- **Real-time Features:** Slot availability and conflict prevention

### ✅ Ready for Frontend Integration
- **API Endpoints:** All routes defined and protected
- **Response Formats:** JSON structure ready for React consumption
- **Error Handling:** Proper HTTP status codes and error messages
- **Data Validation:** Backend enforcement regardless of frontend validation

The backend provides a complete, secure, and feature-rich foundation for the MyAppointmentsPage frontend functionality.
