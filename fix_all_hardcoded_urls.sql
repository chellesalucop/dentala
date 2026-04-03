-- Fix remaining hardcoded localhost URLs in AdminAppointmentsPage.jsx

-- Update check-slots API call
-- Find and replace: http://127.0.0.1:8000/api/appointments/check-slots?date=${walkinData.appointmentDate}
-- Replace with: ${API_URL}/api/appointments/check-slots?date=${walkinData.appointmentDate}

-- Update dentists API call  
-- Find and replace: http://127.0.0.1:8000/api/dentists
-- Replace with: ${API_URL}/api/dentists

-- Also fix password hashing issue:
-- Laravel doesn't auto-hash passwords updated via SQL
-- Need to use Laravel's Hash facade or update via application
