<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AuthController;

// Health check endpoint for performance monitoring
Route::get('/health', function () {
    $startTime = microtime(true);
    
    try {
        // Test database connection
        \Illuminate\Support\Facades\DB::select('SELECT 1');
        $dbStatus = 'ok';
        $dbTime = (microtime(true) - $startTime) * 1000;
    } catch (\Exception $e) {
        $dbStatus = 'error: ' . $e->getMessage();
        $dbTime = null;
    }
    
    // Test queue
    try {
        $jobsCount = \Illuminate\Support\Facades\DB::table('jobs')->count();
        $queueStatus = 'ok';
    } catch (\Exception $e) {
        $queueStatus = 'error: ' . $e->getMessage();
        $jobsCount = null;
    }
    
    $totalTime = (microtime(true) - $startTime) * 1000;
    
    return response()->json([
        'status' => 'healthy',
        'timestamp' => now()->toISOString(),
        'response_time_ms' => round($totalTime, 2),
        'database' => [
            'status' => $dbStatus,
            'test_time_ms' => $dbTime ? round($dbTime, 2) : null
        ],
        'queue' => [
            'status' => $queueStatus,
            'jobs_count' => $jobsCount
        ]
    ]);
});

// 🔧 TEMPORARY: Email diagnostic endpoint - remove after confirming emails work
Route::get('/test-email-diagnostic', function () {
    $diagnostics = [
        'timestamp' => now()->toISOString(),
        'mail_config' => [
            'mailer' => config('mail.default'),
            'host' => config('mail.mailers.smtp.host'),
            'port' => config('mail.mailers.smtp.port'),
            'encryption' => config('mail.mailers.smtp.encryption'),
            'username' => config('mail.mailers.smtp.username'),
            'password_set' => !empty(config('mail.mailers.smtp.password')),
            'password_length' => strlen(config('mail.mailers.smtp.password') ?? ''),
            'from_address' => config('mail.from.address'),
            'from_name' => config('mail.from.name'),
            'queue_connection' => config('queue.default'),
        ],
        'env_check' => [
            'MAIL_MAILER' => env('MAIL_MAILER', 'NOT SET'),
            'MAIL_HOST' => env('MAIL_HOST', 'NOT SET'),
            'MAIL_PORT' => env('MAIL_PORT', 'NOT SET'),
            'MAIL_USERNAME' => env('MAIL_USERNAME', 'NOT SET'),
            'MAIL_PASSWORD_SET' => !empty(env('MAIL_PASSWORD')),
            'MAIL_ENCRYPTION' => env('MAIL_ENCRYPTION', 'NOT SET'),
            'MAIL_FROM_ADDRESS' => env('MAIL_FROM_ADDRESS', 'NOT SET'),
        ],
    ];

    // Try sending a real test email
    try {
        \Illuminate\Support\Facades\Mail::raw(
            'This is a test email from Dentala on Render. Timestamp: ' . now()->toISOString(),
            function ($message) {
                $message->to(config('mail.from.address'))
                        ->subject('Dentala Render SMTP Test - ' . now()->format('H:i:s'));
            }
        );
        $diagnostics['email_result'] = 'SUCCESS - Email sent!';
    } catch (\Exception $e) {
        $diagnostics['email_result'] = 'FAILED';
        $diagnostics['error_message'] = $e->getMessage();
        $diagnostics['error_class'] = get_class($e);
        $diagnostics['error_trace'] = array_slice(explode("\n", $e->getTraceAsString()), 0, 5);
    }

    return response()->json($diagnostics, 200, [], JSON_PRETTY_PRINT);
});

/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/send-otp', [AuthController::class, 'sendOtp']);
Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
Route::post('/reset-password-otp', [AuthController::class, 'resetPasswordWithOtp']);
Route::get('/reminders/send', [AppointmentController::class, 'sendReminders']);
Route::get('/run-migrations', function() {
    try {
        \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
        $output = \Illuminate\Support\Facades\Artisan::output();
        return "<h1>Migration Report</h1><pre>" . $output . "</pre><p>If it says 'Nothing to migrate', your DB is already updated.</p>";
    } catch (\Exception $e) {
        return "<h1>Error</h1><pre>" . $e->getMessage() . "</pre>";
    }
});






/*
|--------------------------------------------------------------------------
| PROTECTED ROUTES (Requires Sanctum Login Token)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth & User Management
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Dentist Selection Route
    Route::get('/dentists', [UserController::class, 'getDentists']);

    // Patient Routes
    Route::get('/appointments', [AppointmentController::class, 'index']);
    Route::post('/appointments', [AppointmentController::class, 'store']);
    Route::get('/appointments/check-slots', [AppointmentController::class, 'checkSlots']);
    Route::delete('/appointments/{id}', [AppointmentController::class, 'destroy']);
    Route::delete('/appointments/clear/{status}', [AppointmentController::class, 'clearByStatus']);
    Route::patch('/appointments/{id}/cancel', [AppointmentController::class, 'cancel']);
    Route::patch('/appointments/{id}/confirm', [AppointmentController::class, 'confirm']);
    Route::patch('/appointments/{id}/reschedule', [AppointmentController::class, 'reschedule']);
    
    Route::put('/user/profile', [UserController::class, 'updateProfile']);
    Route::put('/user/password', [UserController::class, 'changePassword']);
    
    // --- NEW: Profile Picture & HMO Routes ---
    Route::post('/user/profile-picture', [UserController::class, 'updateProfilePicture']);
    Route::post('/user/hmo-card', [UserController::class, 'updateHmoCard']);
    
    // Admin/Dentist Routes
    Route::get('/admin/appointments', [AppointmentController::class, 'adminIndex']);
    Route::patch('/admin/appointments/{id}/status', [AppointmentController::class, 'updateStatus']);
    Route::get('/admin/dashboard-stats', [AppointmentController::class, 'dashboardStats']);
    Route::get('/admin/patients-list', [UserController::class, 'getAdminPatients']);
    Route::get('/admin/patients/{userId}/history', [UserController::class, 'getPatientHistory']);
    
    // Backend Synchronize Label: Admin-Walkin-Route
    Route::post('/admin/appointments/walk-in', [AppointmentController::class, 'storeWalkin']);
});