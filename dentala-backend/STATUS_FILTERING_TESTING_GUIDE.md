# Status Filtering Testing Guide

## 🧪 How to Test the Fix

### Step 1: Test the Enhanced checkSlots Endpoint

**API Call:**
```bash
GET /api/appointments/check-slots?date=2026-03-30
```

**Expected Response Format:**
```json
{
  "taken_times": ["09:00 AM", "11:00 AM"],
  "date": "2026-03-30",
  "total_taken": 2,
  "debug_info": {
    "query_date": "2026-03-30",
    "active_statuses": ["confirmed", "pending"],
    "excluded_statuses": ["completed", "cancelled", "skipped"],
    "all_appointments": [
      {
        "id": 1,
        "preferred_time": "09:00 AM",
        "status": "confirmed",
        "full_name": "John Doe"
      },
      {
        "id": 2,
        "preferred_time": "11:00 AM",
        "status": "pending",
        "full_name": "Jane Smith"
      },
      {
        "id": 3,
        "preferred_time": "05:00 PM",
        "status": "cancelled",
        "full_name": "Katherine Johnson"
      }
    ],
    "taken_appointments": [
      {
        "id": 1,
        "preferred_time": "09:00 AM",
        "status": "confirmed",
        "full_name": "John Doe"
      },
      {
        "id": 2,
        "preferred_time": "11:00 AM",
        "status": "pending",
        "full_name": "Jane Smith"
      }
    ]
  }
}
```

### Step 2: Verify the Logic

**What to Look For:**
1. **taken_times array** should only include times from 'confirmed' or 'pending' appointments
2. **all_appointments** shows ALL appointments for that date (including cancelled/skipped)
3. **taken_appointments** shows only the active ones that block slots
4. **05:00 PM** should NOT be in taken_times if its status is 'cancelled'

### Step 3: Frontend Verification

**In AppointmentFormPage.jsx:**
- The dropdown should show 05:00 PM as available if the database status is 'cancelled'
- The dropdown should show 05:00 PM as "Booked" if the database status is 'pending' or 'confirmed'

**In MyAppointmentsPage.jsx:**
- The UI should accurately reflect the actual database status
- If UI shows "PENDING" but database shows "cancelled", that's the root issue

---

## 🔍 Troubleshooting Steps

### Issue 1: UI Shows Different Status Than Database

**Check the API Response:**
```bash
GET /api/appointments
```

**Look for the specific appointment:**
```json
{
  "id": 3,
  "preferred_time": "05:00 PM",
  "status": "cancelled",  // What database actually says
  "full_name": "Katherine Johnson"
}
```

**If UI shows "PENDING" but API returns "cancelled":**
- The frontend has stale data
- Refresh the page or call fetchAppointments() again
- Check if there's caching in the frontend

### Issue 2: Slot Still Shows as Taken When It Shouldn't

**Check the Debug Info:**
```bash
GET /api/appointments/check-slots?date=2026-03-30
```

**Look at debug_info.all_appointments:**
- Find the 05:00 PM appointment
- Check its actual status
- Verify it's NOT in taken_appointments array

**If status is 'cancelled' but still in taken_times:**
- The backend logic needs adjustment
- Check if there are multiple appointments for the same time

### Issue 3: Multiple Appointments Same Time

**Check for Duplicates:**
```bash
GET /api/appointments/check-slots?date=2026-03-30
```

**Look in all_appointments for:**
- Multiple entries with same preferred_time
- Different statuses for the same time
- One might be 'pending' while another is 'cancelled'

---

## 🛠️ Additional Debugging Tools

### Temporary Debug Endpoint

If you need more detailed debugging, add this temporary method:

```php
public function debugAppointments(Request $request)
{
    $date = $request->query('date', '2026-03-30');
    
    $allAppointments = Appointment::where('appointment_date', $date)
        ->with('user')
        ->get();
    
    return response()->json([
        'date' => $date,
        'total_appointments' => $allAppointments->count(),
        'appointments_by_status' => $allAppointments->groupBy('status'),
        'time_slots_by_status' => $allAppointments->groupBy('preferred_time'),
        'detailed_appointments' => $allAppointments
    ]);
}
```

**Add Route:**
```php
Route::get('/debug/appointments', [AppointmentController::class, 'debugAppointments']);
```

### Database Direct Query

Run this query directly in your database to verify:

```sql
SELECT id, preferred_time, status, full_name 
FROM appointments 
WHERE appointment_date = '2026-03-30'
ORDER BY preferred_time;
```

---

## 📋 Expected Behavior After Fix

### Scenario 1: Cancelled Appointment
- **Database:** 05:00 PM appointment with status 'cancelled'
- **checkSlots Response:** 05:00 PM NOT in taken_times
- **Frontend Dropdown:** 05:00 PM shows as available
- **MyAppointmentsPage:** Shows appointment with 'cancelled' status

### Scenario 2: Pending Appointment
- **Database:** 05:00 PM appointment with status 'pending'
- **checkSlots Response:** 05:00 PM IN taken_times
- **Frontend Dropdown:** 05:00 PM shows as "Booked"
- **MyAppointmentsPage:** Shows appointment with 'pending' status

### Scenario 3: Completed Appointment
- **Database:** 05:00 PM appointment with status 'completed'
- **checkSlots Response:** 05:00 PM NOT in taken_times (slot freed for future)
- **Frontend Dropdown:** 05:00 PM shows as available
- **MyAppointmentsPage:** Shows appointment with 'completed' status

---

## 🎯 Quick Verification Checklist

- [ ] checkSlots endpoint returns debug_info
- [ ] taken_times only includes 'confirmed' and 'pending' appointments
- [ ] Cancelled appointments don't block slots
- [ ] Completed appointments don't block slots
- [ ] Frontend dropdown matches backend logic
- [ ] MyAppointmentsPage shows correct statuses
- [ ] No status mismatch between UI and database

---

## 🔄 How to Remove Debug Mode

Once everything is working correctly, remove the debug info:

```php
public function checkSlots(Request $request)
{
    $request->validate([
        'date' => 'required|date'
    ]);

    $date = $request->query('date');
    
    $takenSlots = Appointment::where('appointment_date', $date)
        ->whereIn('status', ['confirmed', 'pending'])
        ->pluck('preferred_time')
        ->toArray();

    return response()->json([
        'taken_times' => $takenSlots,
        'date' => $date,
        'total_taken' => count($takenSlots)
    ], 200);
}
```

This will remove the debug_info and return to the clean response format.
