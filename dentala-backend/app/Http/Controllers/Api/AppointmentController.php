<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Mail\WalkinReceiptMail;
use App\Mail\PatientNotificationMail;
use App\Mail\AdminNotificationMail;
use App\Services\BrevoApiMailer;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Artisan;
// 🛡️ THE CRITICAL MISSING PIECE: Add this exact line at the top
use Illuminate\Support\Str;

class AppointmentController extends Controller
{
    /**
     * For Patients: See only their own appointments.
     */
    public function index(Request $request)
    {
        // 🚀 PERFORMANCE LOGGING: Track query execution time
        $startTime = microtime(true);
        
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        \Log::info('appointments/index: Starting query for user ' . $user->id);

        $this->autoExpireAppointments();

        // 🛡️ PATIENT FULL IDENTITY PAYLOAD: Include profile photo and booking email
        $appointments = Appointment::where('appointments.user_id', $user->id)
            ->leftJoin('users', 'appointments.user_id', '=', 'users.id')
            ->orderBy('appointment_date', 'asc')
            ->get([
                'appointments.*', // Simplest way to ensure all fields are sent
                'users.profile_photo_path', 
                'users.email as user_email'
            ]);

        $endTime = microtime(true);
        $executionTime = ($endTime - $startTime) * 1000; // Convert to milliseconds
        
        \Log::info("appointments/index: Query completed in {$executionTime}ms, found " . count($appointments) . " appointments");

        return response()->json($appointments);
    }

    /**
     * For Patients: Book a new appointment.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $this->autoExpireAppointments();

        // 🛡️ THE "STRICT TOTAL" GUARD
        // We count both PENDING and CONFIRMED. 
        // This stops them from filling the calendar.
        $activeCount = Appointment::where('user_id', $user->id)
                                    ->whereIn('status', ['pending', 'confirmed'])
                                    ->count();

        if ($activeCount >= 3) {
            return response()->json([
                'message' => 'Limit Reached: You can only have 3 active appointments at a time. Please complete or cancel your existing ones to book more.'
            ], 429);
        }

        // 🛡️ SILENT GUARD: Backend enforces strict validation even if Frontend is relaxed
        $messages = [
            'phone.digits' => 'Oops! Your phone number must be exactly 11 digits.',
            'email.regex' => 'Please provide a valid email address. (example@gmail.com)',
            'email.email' => 'Please provide a valid email address. (example@gmail.com)',
            'full_name.regex' => 'Names should only contain letters, periods, and spaces.',
            'full_name.required' => 'Full name is required for medical records.',
            'full_name.max' => 'Patient name cannot exceed 50 characters.',
            'phone.required' => 'Phone number is required.',
            'phone.numeric' => 'Phone number must contain only digits.',
            'phone.digits_between' => 'Please enter a valid 10 or 11-digit phone number.',
            'appointment_date.after' => 'Appointments must be booked at least one day in advance.',
        ];

        $validated = $request->validate([
            // Allows letters, spaces, and periods (e.g., "Dr. Juan Dela Cruz")
            'full_name' => 'required|string|regex:/^[a-zA-Z\s.]+$/|max:50',
            
            // Strictly numeric and exactly 11 digits
            'phone' => 'required|numeric|digits:11',
            
            // 🛡️ STRICT EMAIL GUARD: Ensures it ends with a valid TLD (2-4 chars)
            'email' => [
                'required',
                'email',
                'regex:/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/'
            ],
            'service_type' => 'required|string|max:255',
            'custom_service' => 'nullable|string|max:255',
            'preferred_dentist' => 'required|string|max:255',
            'medical_conditions' => 'nullable|array',
            'others' => 'nullable|string|max:255',
            'appointment_date' => 'required|date|after:today',
            'preferred_time' => 'required|string|max:50',
            'hmo_provider' => 'nullable|string',
            'hmo_card_path' => 'nullable|string',
        ], $messages);

        $validated['user_id'] = $user->id;
        $validated['status'] = 'pending'; 

        $appointment = Appointment::create($validated);

        // Send emails directly from the web process so delivery does not depend on a queue worker.
        try {
            // 🚀 CACHE FIX: Cache dentist lookup to avoid repeated queries
            static $dentistCache = [];
            $dentistEmail = $appointment->preferred_dentist;
            
            if (!isset($dentistCache[$dentistEmail])) {
                $dentist = \App\Models\User::where('email', $dentistEmail)->first();
                $dentistCache[$dentistEmail] = $dentist ? $dentist->name : 'Dentala Clinic Specialist';
            }
            $dentistName = $dentistCache[$dentistEmail];

            // 📧 DEBUG: Log email configuration
            \Log::info('Email configuration - Host: ' . config('mail.mailers.smtp.host'));
            \Log::info('Email configuration - Username: ' . config('mail.mailers.smtp.username'));
            \Log::info('Email configuration - From: ' . config('mail.from.address'));

            // Send admin notification (if different from patient email)
            if (strtolower($appointment->preferred_dentist) !== strtolower($appointment->email)) {
                \Log::info('Sending admin notification to: ' . $appointment->preferred_dentist);
                try {
                    app(BrevoApiMailer::class)->sendMailable($appointment->preferred_dentist, new AdminNotificationMail($appointment, 'New Booking'));
                    \Log::info('Admin notification sent successfully to: ' . $appointment->preferred_dentist);
                } catch (\Exception $e) {
                    \Log::error('Admin notification failed: ' . $e->getMessage());
                    \Log::error('Admin notification error trace: ' . $e->getTraceAsString());
                }
            }
            
            // Send patient notification
            \Log::info('Sending patient notification to: ' . $appointment->email);
            try {
                app(BrevoApiMailer::class)->sendMailable($appointment->email, new PatientNotificationMail($appointment, 'pending', '', $dentistName));
                \Log::info('Patient notification sent successfully to: ' . $appointment->email);
            } catch (\Exception $e) {
                \Log::error('Patient notification failed: ' . $e->getMessage());
                \Log::error('Patient notification error trace: ' . $e->getTraceAsString());
            }
            
            \Log::info('Emails processed successfully');
        } catch (\Exception $e) { 
            \Log::error('Mail sending failed: ' . $e->getMessage());
            \Log::error('Mail error trace: ' . $e->getTraceAsString());
            // Continue even if email fails - appointment is still saved
        }

        return response()->json(['message' => 'Appointment booked successfully!', 'appointment' => $appointment], 201);

    }

    /**
     * For Patients: Confirm their own appointment
     */
    public function confirm(Request $request, $id)
    {
        $appointment = Appointment::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->where('status', 'pending')
            ->firstOrFail();

        $appointment->status = 'confirmed';
        $appointment->save();

        \Log::info('Sending patient confirmation email to dentist: ' . $appointment->preferred_dentist);
        
        try {
            app(BrevoApiMailer::class)->sendMailable($appointment->preferred_dentist, new \App\Mail\AdminNotificationMail($appointment, 'Patient Confirmed'));
            \Log::info('Patient confirmation email sent successfully to dentist');
        } catch (\Exception $e) { 
            \Log::error('Confirmation mail sending failed: ' . $e->getMessage());
            // Continue even if email fails - confirmation is still saved
        }

        return response()->json(['message' => 'Appointment confirmed successfully!']);
    }

    /**
     * For Patients: Cancel their own appointment with required reason
     */
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

        // Send cancellation email directly from the web process.
        try {
            app(BrevoApiMailer::class)->sendMailable($appointment->preferred_dentist, new \App\Mail\AdminNotificationMail($appointment, 'Patient Cancellation'));
            \Log::info('Cancellation email sent successfully to dentist');
        } catch (\Exception $e) { 
            \Log::error("Cancellation mail sending failed: " . $e->getMessage());
            // Continue even if email fails - cancellation is still saved
        }

        return response()->json(['message' => 'Appointment cancelled successfully.']);
    }

    /**
     * For Patients: Reschedule an appointment.
     */
    public function reschedule(Request $request, $id)
    {
        $request->validate([
            'appointment_date' => 'required|date|after:today',
            'preferred_time' => 'required|string|max:50',
        ], [
            'appointment_date.after' => 'Appointments must be booked at least one day in advance.',
        ]);

        $appointment = Appointment::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $appointment->appointment_date = $request->appointment_date;
        $appointment->preferred_time = $request->preferred_time;
        
        $appointment->status = 'pending'; 
        $appointment->save();

        // Send reschedule notification emails directly from the web process
        try {
            // Cache dentist lookup to avoid repeated queries
            static $dentistCache = [];
            $dentistEmail = $appointment->preferred_dentist;
            
            if (!isset($dentistCache[$dentistEmail])) {
                $dentist = \App\Models\User::where('email', $dentistEmail)->first();
                $dentistCache[$dentistEmail] = $dentist ? $dentist->name : 'Dentala Clinic Specialist';
            }
            $dentistName = $dentistCache[$dentistEmail];

            // Send admin notification (if different from patient email)
            if (strtolower($appointment->preferred_dentist) !== strtolower($appointment->email)) {
                \Log::info('Sending reschedule admin notification to: ' . $appointment->preferred_dentist);
                try {
                    app(BrevoApiMailer::class)->sendMailable($appointment->preferred_dentist, new AdminNotificationMail($appointment, 'Reschedule Request'));
                    \Log::info('Reschedule admin notification sent successfully to: ' . $appointment->preferred_dentist);
                } catch (\Exception $e) {
                    \Log::error('Reschedule admin notification failed: ' . $e->getMessage());
                    \Log::error('Reschedule admin notification error trace: ' . $e->getTraceAsString());
                }
            }
            
            // Send patient notification
            \Log::info('Sending reschedule patient notification to: ' . $appointment->email);
            try {
                app(BrevoApiMailer::class)->sendMailable($appointment->email, new PatientNotificationMail($appointment, 'pending', 'Your appointment has been rescheduled. Please wait for admin confirmation.', $dentistName));
                \Log::info('Reschedule patient notification sent successfully to: ' . $appointment->email);
            } catch (\Exception $e) {
                \Log::error('Reschedule patient notification failed: ' . $e->getMessage());
                \Log::error('Reschedule patient notification error trace: ' . $e->getTraceAsString());
            }
            
            \Log::info('Reschedule emails processed successfully');
        } catch (\Exception $e) { 
            \Log::error('Reschedule mail sending failed: ' . $e->getMessage());
            \Log::error('Reschedule mail error trace: ' . $e->getTraceAsString());
            // Continue even if email fails - appointment is still rescheduled
        }

        return response()->json([
            'message' => 'Appointment rescheduled successfully.',
            'appointment' => $appointment
        ]);
    }

    /**
     * ENHANCED: For Admins Full List with Complete Data Hydration
     * Used for the Appointments tab - includes all fields for comprehensive view
     */
    public function adminIndex(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Access Denied.'], 403);
        }

        $this->autoExpireAppointments($user->email);

        // 🛡️ ADMIN STRENGTH: Include all fields for comprehensive appointment management
        // 🔄 CHRONOLOGICAL QUEUE: Two-tier sorting for admin workflow
        // 📅 NEWEST FIRST: Include created_at for booking sequence
        $appointments = Appointment::whereRaw('LOWER(preferred_dentist) = ?', [strtolower($user->email)])
            ->leftJoin('users', 'appointments.user_id', '=', 'users.id')
            ->orderBy('appointment_date', 'asc')
            ->orderBy('preferred_time', 'asc')
            ->get([
                'appointments.id', 'appointments.user_id', 'appointments.full_name', 'appointments.phone', 'appointments.email', 
                'appointments.service_type', 'appointments.custom_service', 'appointments.preferred_dentist',
                'appointments.medical_conditions', 'appointments.others', 'appointments.appointment_date', 
                'appointments.preferred_time', 'appointments.status', 'appointments.cancellation_reason',
                'appointments.created_at', 'appointments.updated_at', // 🛡️ CRITICAL MISSING PIECE
                'appointments.hmo_provider', 'appointments.hmo_card_path',
                'users.profile_photo_path', 'users.email as user_email'
            ]);

        return response()->json($appointments);
    }

    /**
     * ENHANCED: For Admins Dashboard with Full Data Hydration
     * Includes custom_service and others fields for immediate admin visibility
     */
    public function dashboardStats(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'admin') return response()->json(['message' => 'Access Denied.'], 403);

        $this->autoExpireAppointments($user->email);

        // Use the imported Carbon class correctly
        $today = \Carbon\Carbon::today()->toDateString();

        // 🛡️ DATA HYDRATION: Ensure EVERY field used in JSX is selected here
        $selectFields = [
            'appointments.id', 'appointments.user_id', 'appointments.full_name', 'appointments.phone', 'appointments.email', 
            'appointments.service_type', 'appointments.custom_service', 'appointments.preferred_dentist',
            'appointments.medical_conditions', 'appointments.others', 'appointments.appointment_date', 
            'appointments.preferred_time', 'appointments.status', 'appointments.cancellation_reason',
            'appointments.created_at', 'appointments.updated_at', // 🛡️ NECESSARY FOR TIMESTAMPS
            'appointments.hmo_provider', 'appointments.hmo_card_path',
            'users.profile_photo_path', 'users.email as user_email'
        ];

        // 1. Fetch Today's Schedule (Only Confirmed or Completed for today)
        $todaysSchedule = Appointment::whereRaw('LOWER(preferred_dentist) = ?', [strtolower($user->email)])
            ->leftJoin('users', 'appointments.user_id', '=', 'users.id')
            ->where('appointment_date', $today)
            ->whereIn('status', ['confirmed', 'completed'])
            // 🛡️ THE POSTGRES FIX: Use to_timestamp for AM/PM sorting in PostgreSQL
            ->orderByRaw("to_timestamp(preferred_time, 'HH12:MI AM') ASC") 
            ->get($selectFields)
            ->map(function ($appointment) {
                // 🛡️ DASHBOARD STATS STRING SANITIZATION: Truncate long strings
                $appointment->full_name = \Illuminate\Support\Str::limit($appointment->full_name, 30);
                $appointment->service_type = \Illuminate\Support\Str::limit($appointment->service_type, 25);
                $appointment->custom_service = $appointment->custom_service ? \Illuminate\Support\Str::limit($appointment->custom_service, 25) : null;
                return $appointment;
            });

        // 2. Fetch Pending Approvals (Regardless of date)
        $pendingApprovals = Appointment::whereRaw('LOWER(preferred_dentist) = ?', [strtolower($user->email)])
            ->leftJoin('users', 'appointments.user_id', '=', 'users.id')
            ->where('status', 'pending')
            ->orderBy('appointment_date', 'asc')

            ->get($selectFields)
            ->map(function ($appointment) {
                // 🛡️ DASHBOARD STATS STRING SANITIZATION: Truncate long strings
                $appointment->full_name = Str::limit($appointment->full_name, 30);
                $appointment->service_type = Str::limit($appointment->service_type, 25);
                $appointment->custom_service = $appointment->custom_service ? Str::limit($appointment->custom_service, 25) : null;
                return $appointment;
            });

        // 3. Fetch Skipped Appointments for No-Show Analytics
        // 🛡️ NO-SHOW TRACKING: Monitor patient attendance patterns
        $skippedAppointments = Appointment::whereRaw('LOWER(preferred_dentist) = ?', [strtolower($user->email)])
            ->where('status', 'skipped')
            ->orderBy('appointment_date', 'desc')
            ->limit(10) // Show recent 10 skipped appointments
            ->get([
                'id', 'user_id', 'full_name', 'phone', 'email', 
                'service_type', 'preferred_dentist',
                'appointment_date', 'preferred_time', 'status'
            ]);

        // 4. Enhanced Response with Admin Metadata
        return response()->json([
            'today' => Carbon::today()->format('F j, Y'),
            'todaysSchedule' => $todaysSchedule,
            'pendingApprovals' => $pendingApprovals,
            'skippedAppointments' => $skippedAppointments,
            'meta' => [
                'todaysCount' => $todaysSchedule->count(),
                'pendingCount' => $pendingApprovals->count(),
                'skippedCount' => $skippedAppointments->count(),
                'hasCustomServices' => $pendingApprovals->contains('service_type', 'Other'),
                'hasMedicalAlerts' => $pendingApprovals->contains(function($appointment) {
                    return !empty($appointment->medical_conditions) || !empty($appointment->others);
                })
            ]
        ]);
    }

    /**
     * For Admins: Update status with Audit Trail for Declined and No-Shows
     */
    public function updateStatus(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role !== 'admin') return response()->json(['message' => 'Access Denied.'], 403);

        // 🛡️ THE FIX: Added 'declined', 'no-show', and 'expired' to the allowed list to prevent 422 errors
        $request->validate([
            'status' => 'required|string|in:pending,confirmed,completed,cancelled,skipped,declined,no-show,expired',
            'cancellation_reason' => 'nullable|string|max:500'
        ]);

        $appointment = Appointment::where('id', $id)
            ->whereRaw('LOWER(preferred_dentist) = ?', [strtolower($user->email)])
            ->firstOrFail();

        $appointment->status = $request->status;
        
        // 🛡️ AUDIT TRAIL: Save reason for ANY unsuccessful outcome
        $unsuccessfulStatuses = ['cancelled', 'declined', 'no-show', 'skipped', 'expired'];
        
        if (in_array($request->status, $unsuccessfulStatuses)) {
            // If no reason was provided by the dentist, we can set a default or leave as null
            $appointment->cancellation_reason = $request->cancellation_reason;
        } else {
            // Data hygiene: Clear reason if status is active (pending/confirmed/completed)
            $appointment->cancellation_reason = null;
        }
        
        // 🛡️ Ensure the timestamp updates so the frontend has a valid date to parse
        $appointment->touch();
        $appointment->save();

        \Log::info('Sending status update email to patient: ' . $appointment->email);
        \Log::info('Appointment status: ' . $request->status);
        
        try {
            // 🚀 CACHE FIX: Cache dentist lookup to avoid repeated queries
            static $dentistCache = [];
            $dentistEmail = $appointment->preferred_dentist;
            
            if (!isset($dentistCache[$dentistEmail])) {
                $dentist = \App\Models\User::where('email', $dentistEmail)->first();
                $dentistCache[$dentistEmail] = $dentist ? $dentist->name : 'Dentala Clinic Specialist';
            }
            $dentistName = $dentistCache[$dentistEmail];

            app(BrevoApiMailer::class)->sendMailable($appointment->email, new PatientNotificationMail(
                $appointment, 
                $request->status, 
                $request->cancellation_reason ?? '',
                $dentistName
            ));
            \Log::info('Status update email sent successfully');
        } catch (\Exception $e) { 
            \Log::error('Mail sending failed: ' . $e->getMessage());
            // Continue even if email fails - status update is still saved
        }

        return response()->json([
            'message' => "Appointment marked as {$request->status}.", 
            'appointment' => $appointment->fresh() // Return the refreshed model with new timestamps
        ]);
    }

    /**
     * Check available slots for a given date
     * Returns array of taken times for frontend slot management
     */
    public function checkSlots(Request $request)
    {
        $request->validate(['date' => 'required|date']);
        $date = $request->query('date');

        $this->autoExpireAppointments();

        // 🛡️ OPTIMIZED: Use select and index for faster query
        $takenSlots = Appointment::where('appointment_date', $date)
            ->whereIn('status', ['pending', 'confirmed']) 
            ->select('preferred_time')
            ->get()
            ->pluck('preferred_time')
            ->map(function ($time) {
                // 🛡️ TIME FORMAT FIX: Convert datetime to simple time format for frontend
                return $time; // Already formatted from frontend, no need to parse
            })
            ->toArray();

        return response()->json([
            'taken_times' => $takenSlots,
            'date' => $date
        ], 200);
    }

    /**
     * Delete a specific appointment
     */
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

    /**
     * Clear all appointments by status (past or cancelled)
     */
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

    /**
     * Backend Synchronize Label: Admin-Walkin-Validation-v2
     * Store walk-in appointment with advanced validation and receipt data
     */
    public function storeWalkin(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Access Denied.'], 403);
        }

        $rules = [
            'fullName' => 'required|string|regex:/^[A-Za-z\s.\-\']+$/|max:50',
            'phone' => 'required|digits_between:10,11',
            'email' => 'required|email',
            'serviceType' => 'required|in:Regular Checkup,Dental Cleaning,Tooth Filling,Tooth Extraction,Teeth Whitening,Braces Consultation,Other',
            'appointmentDate' => 'required|date|after_or_equal:today',
            'preferredTime' => 'required|string',
            'preferredDentist' => 'required|exists:users,email',
            'medicalConditions' => 'nullable|array',
            'others' => 'nullable|string',
        ];

        // Conditional Validation for "Other" service
        if ($request->serviceType === 'Other') {
            $rules['customService'] = 'required|string|min:3';
        }

        $validated = $request->validate($rules);

        $appointment = Appointment::create([
            'full_name' => $validated['fullName'],
            'phone' => $validated['phone'],
            'email' => $validated['email'],
            'service_type' => $validated['serviceType'],
            'custom_service' => $validated['customService'] ?? null,
            'preferred_dentist' => $validated['preferredDentist'],
            'appointment_date' => $validated['appointmentDate'],
            'preferred_time' => $validated['preferredTime'],
            'medical_conditions' => json_encode($validated['medicalConditions']),
            'others' => $validated['others'],
            'hmo_provider' => $validated['hmo_provider'] ?? null,
            'hmo_card_path' => $validated['hmo_card_path'] ?? null,
            'status' => 'confirmed',
            'booked_by_admin' => true,
        ]);

        // 📧 Trigger the Email Notification
        try {
            app(BrevoApiMailer::class)->sendMailable($appointment->email, new WalkinReceiptMail($appointment));
        } catch (\Exception $e) {
            // Log error but don't stop the response; the appointment is still saved
            \Log::error("Mail failed: " . $e->getMessage());
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Walk-in registered and email sent!',
            'data' => [
                'id' => $appointment->id,
                'fullName' => $appointment->full_name,
                'serviceType' => $appointment->service_type,
                'customService' => $appointment->custom_service,
                'appointmentDate' => $appointment->appointment_date,
                'preferredTime' => $appointment->preferred_time,
                'preferredDentist' => $appointment->preferred_dentist,
                'status' => $appointment->status
            ]
        ], 201);
    }

    /**
     * 🛡️ THE REMINDER: Sends emails to patients scheduled for tomorrow
     * This should be triggered once a day by a Cron Job (e.g. cron-job.org)
     */
    public function sendReminders()
    {
        $tomorrow = \Carbon\Carbon::tomorrow()->toDateString();
        
        $toRemind = Appointment::where('status', 'confirmed')
            ->where('appointment_date', $tomorrow)
            ->get();

        if ($toRemind->isEmpty()) {
            return response()->json(['message' => 'No appointments to remind for tomorrow.'], 200);
        }

        $count = 0;
        // 🚀 CACHE FIX: Cache dentist lookups for batch processing
        $dentistCache = [];
        
        foreach ($toRemind as $appointment) {
            try {
                $dentistEmail = $appointment->preferred_dentist;
                if (!isset($dentistCache[$dentistEmail])) {
                    $dentist = \App\Models\User::where('email', $dentistEmail)->first();
                    $dentistCache[$dentistEmail] = $dentist ? $dentist->name : 'Dentala Clinic Specialist';
                }
                $dentistName = $dentistCache[$dentistEmail];

                app(BrevoApiMailer::class)->sendMailable($appointment->email, new PatientNotificationMail(
                    $appointment, 
                    'reminder', 
                    'Friendly reminder: Your appointment is scheduled for tomorrow. Please arrive 15 minutes early. We look forward to seeing you!',
                    $dentistName
                ));
                $count++;
            } catch (\Exception $e) { \Log::error("Reminder Mail failed: " . $e->getMessage()); }
        }

        return response()->json(['message' => "Successfully sent {$count} reminders for {$tomorrow}."], 200);
    }

    /**
     * 🛡️ THE JANITOR: Automatically expires pending appointments that are past due
     */
    private function autoExpireAppointments($dentistEmail = null)
    {
        $now = Carbon::now();

        $query = Appointment::query()
            ->whereIn('status', ['pending', 'confirmed'])
            ->whereDate('appointment_date', '<=', $now->toDateString());

        // If a dentist email is provided (Admin view), scope it to them
        if ($dentistEmail) {
            $query->whereRaw('LOWER(preferred_dentist) = ?', [strtolower($dentistEmail)]);
        }

        $toExpire = $query->get()->filter(function (Appointment $appointment) use ($now) {
            return $this->isAppointmentOverdue($appointment, $now);
        });

        if ($toExpire->isNotEmpty()) {
            Appointment::whereIn('id', $toExpire->pluck('id'))->update([
                'status' => 'expired',
                'updated_at' => now(),
                'cancellation_reason' => 'Automatically expired: Appointment time has passed without clinic action.'
            ]);
            
            \Log::info("Expired " . $toExpire->count() . " appointments without email notifications");
        }
    }

    private function isAppointmentOverdue(Appointment $appointment, Carbon $now): bool
    {
        $appointmentDate = $appointment->getRawOriginal('appointment_date') ?: $appointment->appointment_date;
        $preferredTime = $appointment->getRawOriginal('preferred_time') ?: $appointment->preferred_time;

        if (empty($appointmentDate) || empty($preferredTime)) {
            return false;
        }

        $dateTime = $this->parseAppointmentDateTime((string) $appointmentDate, (string) $preferredTime);

        if (!$dateTime) {
            \Log::warning('Failed to parse appointment datetime for expiration check', [
                'appointment_id' => $appointment->id,
                'appointment_date' => $appointmentDate,
                'preferred_time' => $preferredTime,
            ]);

            return false;
        }

        return $dateTime->lte($now);
    }

    private function parseAppointmentDateTime(string $appointmentDate, string $preferredTime): ?Carbon
    {
        $normalizedTime = trim($preferredTime);
        $formats = [
            'Y-m-d h:i A',
            'Y-m-d g:i A',
            'Y-m-d H:i',
            'Y-m-d H:i:s',
        ];

        foreach ($formats as $format) {
            try {
                return Carbon::createFromFormat($format, trim($appointmentDate) . ' ' . $normalizedTime);
            } catch (\Throwable) {
                continue;
            }
        }

        try {
            return Carbon::parse(trim($appointmentDate) . ' ' . $normalizedTime);
        } catch (\Throwable) {
            return null;
        }
    }
}