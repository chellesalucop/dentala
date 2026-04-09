<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AuthController;

// Health check endpoint for Render
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
        'version' => '1.0.0'
    ]);
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