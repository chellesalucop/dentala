<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\ForgotPasswordRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;
use App\Mail\OtpMail;

class AuthController extends Controller
{
    public function register(StoreUserRequest $request)
    {
        // 1. Create the user (validation already handled by StoreUserRequest)
        $user = User::create([
            'email'    => $request->email,
            'phone'    => $request->phone,
            'password' => Hash::make($request->password),
            'role'     => 'patient', // Hard-coded role assignment for 2-role system
        ]);

        // 2. Generate an API token
        $token = $user->createToken('auth_token')->plainTextToken;

        // 3. Return token and user data to React
        return response()->json([
            'message' => 'Account created successfully!',
            'access_token' => $token,
            'user' => $user
        ], 201);
    }

    public function login(Request $request) {
        // 1. Run validation
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        // 2. If validation fails (e.g., wrong email format), return your custom message
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Invalid email or password.' 
            ], 422);
        }

        $credentials = $request->only('email', 'password');

        // 3. If authentication fails (wrong credentials), return the same message
        if (! Auth::attempt($credentials)) {
            return response()->json([
                'message' => 'Invalid email or password.'
            ], 401);
        }
        
        // Get the authenticated user
        $user = Auth::user();
        
        // Generate Sanctum token
        $token = $user->createToken('auth_token')->plainTextToken;

        // Return 200 OK + token + role for JSX routing
        return response()->json([
            'message' => 'Logged in successfully!',
            'access_token' => $token,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role, // admin or patient for JSX routing
                'phone' => $user->phone,
                'profile_photo_path' => $user->profile_photo_path
            ]
        ], 200);
    }

    public function logout(Request $request)
    {
        // Delete the current access token
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully!'
        ], 200);
    }

    /**
     * Send OTP to user's email for password reset
     */
    public function sendOtp(ForgotPasswordRequest $request) {

        // 1. Check if email exists
        $user = User::where('email', $request->email)->first();
        
        if (!$user) {
            // For security, still return success but don't send email
            return response()->json(['message' => 'OTP sent successfully.'], 200);
        }

        // 2. Generate 6-digit OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        // 3. Store OTP in password_resets table with expiration
        DB::table('password_resets')->updateOrInsert(
            ['email' => $request->email],
            [
                'token' => $otp,
                'created_at' => now(),
                'expires_at' => now()->addMinutes(5)
            ]
        );

        // Queue the OTP email so the API response is not blocked by SMTP latency.
        try {
            Mail::to($request->email)->queue(new \App\Mail\OtpMail($otp));
            
            return response()->json([
                'message' => 'OTP sent successfully.',
                'expires_at' => now()->addMinutes(5)->toDateTimeString()
            ], 200);

        } catch (\Exception $e) {
            // Log queue push failures so you can inspect them in storage/logs/laravel.log.
            \Log::error("Mail Error: " . $e->getMessage());
            
            return response()->json([
                'message' => 'Mail service error. Please try again later.'
            ], 500);
        }
    }

    /**
     * Verify OTP and return temporary verification token
     */
    public function verifyOtp(Request $request) {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|digits:6'
        ]);

        // 1. Check if OTP exists and is valid
        $resetRecord = DB::table('password_resets')
            ->where('email', $request->email)
            ->where('token', $request->otp)
            ->where('expires_at', '>', now())
            ->first();

        if (!$resetRecord) {
            return response()->json(['message' => 'Invalid or expired OTP.'], 400);
        }

        // 2. Generate temporary verification token for password change
        $verificationToken = Str::random(60);
        
        // 3. Mark OTP as verified by updating the record
        DB::table('password_resets')
            ->where('email', $request->email)
            ->where('token', $request->otp)
            ->update(['verified_at' => now(), 'verification_token' => $verificationToken]);

        return response()->json([
            'message' => 'OTP verified successfully.',
            'verification_token' => $verificationToken
        ], 200);
    }

    /**
     * Reset password using verification token
     */
    public function resetPasswordWithOtp(Request $request) {
        $request->validate([
            'email' => 'required|email',
            'verification_token' => 'required|string',
            'password' => 'required|min:8|confirmed'
        ]);

        // 1. Check if verification token exists and is valid
        $resetRecord = DB::table('password_resets')
            ->where('email', $request->email)
            ->where('verification_token', $request->verification_token)
            ->where('verified_at', '>', now()->subMinutes(30)) // Token valid for 30 minutes after OTP verification
            ->first();

        if (!$resetRecord) {
            return response()->json(['message' => 'Invalid or expired verification token.'], 400);
        }

        // 2. Find user and update password
        $user = User::where('email', $request->email)->first();
        
        if (!$user) {
            return response()->json(['message' => 'User not found.'], 400);
        }

        // 3. Update password
        $user->password = Hash::make($request->password);
        $user->save();

        // 4. Clean up reset records for this email
        DB::table('password_resets')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Password has been reset.'], 200);
    }
}