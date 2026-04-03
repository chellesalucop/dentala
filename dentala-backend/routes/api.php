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

// 🛠️ REFINED FIX ROUTE: Visit your-site.com/api/reset-admin after deployment
Route::get('/reset-admin', function () {
    $targetEmail = 'mrasalucop01@tip.edu.ph';
    $user = \App\Models\User::where('email', $targetEmail)->first();

    if ($user) {
        $user->password = \Illuminate\Support\Facades\Hash::make('admin12345'); 
        $user->role = 'admin'; // Ensure the role is correct
        $user->save();
        return response()->json([
            'message' => 'SUCCESS! Password reset for ' . $targetEmail, 
            'new_password' => 'admin12345'
        ], 200);
    }

    // DEBUG: If not found, show what users actually exist
    $allUsers = \App\Models\User::select('email', 'role')->get();
    return response()->json([
        'message' => 'ERROR: Account ' . $targetEmail . ' not found in database.',
        'available_accounts' => $allUsers
    ], 404);
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
    Route::patch('/appointments/{id}/reschedule', [AppointmentController::class, 'reschedule']);
    
    Route::put('/user/profile', [UserController::class, 'updateProfile']);
    Route::put('/user/password', [UserController::class, 'changePassword']);
    
    // --- NEW: Profile Picture Route ---
    Route::post('/user/profile-picture', [UserController::class, 'updateProfilePicture']);
    
    // Admin/Dentist Routes
    Route::get('/admin/appointments', [AppointmentController::class, 'adminIndex']);
    Route::patch('/admin/appointments/{id}/status', [AppointmentController::class, 'updateStatus']);
    Route::get('/admin/dashboard-stats', [AppointmentController::class, 'dashboardStats']);
    Route::get('/admin/patients-list', [UserController::class, 'getAdminPatients']);
    Route::get('/admin/patients/{userId}/history', [UserController::class, 'getPatientHistory']);
    
    // Backend Synchronize Label: Admin-Walkin-Route
    Route::post('/admin/appointments/walk-in', [AppointmentController::class, 'storeWalkin']);
});