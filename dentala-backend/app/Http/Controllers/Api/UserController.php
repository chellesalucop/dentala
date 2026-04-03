<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use App\Models\User;
use App\Models\Appointment;

class UserController extends Controller
{
    /**
     * Unified Patients List: Groups by Full Name to separate dependents (like sons/daughters)
     * even if they share the same account or email.
     */
    public function getAdminPatients(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Access Denied.'], 403);
        }

        /**
         * LOGIC:
         * We group by 'full_name' so "Josh" and "Marc" are separate records.
         * We also include 'email' and 'user_id' in the group to maintain data integrity.
         */
        $patients = Appointment::where('preferred_dentist', $user->email)
            ->select('full_name as username', 'email', 'phone', 'user_id')
            ->selectRaw('count(*) as appointments_count')
            ->groupBy('full_name', 'email', 'phone', 'user_id')
            ->orderBy('full_name', 'asc')
            ->get()
            ->map(function($appt) {
                // If there is a user_id, let's try to get their profile picture
                $registeredAccount = $appt->user_id ? User::find($appt->user_id) : null;
                
                // All patients without accounts are now considered guests/dependents
                $isDependent = !$registeredAccount;

                return [
                    // THE FIX: Add phone/email to hash to ensure uniqueness for same names
                    'id' => $appt->user_id 
                            ? $appt->user_id . '-' . md5($appt->username . $appt->phone . $appt->email)
                            : 'guest-' . md5($appt->username . $appt->phone . $appt->email),
                    'real_user_id' => $appt->user_id,
                    'username' => $appt->username, // This is the Patient's Name
                    'email' => $appt->email,
                    'phone' => $appt->phone,
                    'profile_photo_path' => ($registeredAccount && !$isDependent) ? $registeredAccount->profile_photo_path : null,
                    'appointments_count' => $appt->appointments_count,
                    'is_guest' => $isDependent
                ];
            });

        return response()->json($patients);
    }

    /**
     * Get Patient Appointment History with Full Medical Details
     * Used for AdminPatientsPage.jsx history modal
     */
    public function getPatientHistory(Request $request, $userId)
    {
        $user = $request->user();

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Access Denied.'], 403);
        }

        // 🛡️ MEDICAL HISTORY: Include all fields for comprehensive patient history
        $appointments = Appointment::where('preferred_dentist', $user->email)
            ->where(function($query) use ($userId) {
                // Handle both registered users and guests/dependents
                $query->where('user_id', $userId)
                      ->orWhere('email', function($subQuery) use ($userId) {
                          // If userId is a guest format, find by email
                          if (str_contains($userId, 'guest-')) {
                              $guestEmail = Appointment::where('id', str_replace('guest-', '', $userId))
                                  ->value('email');
                              if ($guestEmail) {
                                  $subQuery->where('email', $guestEmail);
                              }
                          }
                      });
            })
            // 🛡️ THE FIX: Include all historical statuses (declined, no-show) in patient history
            ->whereIn('status', ['completed', 'cancelled', 'declined', 'no-show', 'skipped'])
            ->orderBy('appointment_date', 'desc')
            ->get([
                'id', 'user_id', 'full_name', 'phone', 'email', 
                'service_type', 'custom_service', 'preferred_dentist',
                'medical_conditions', 'others', 'appointment_date', 
                'preferred_time', 'status', 'cancellation_reason'
            ]);

        return response()->json($appointments);
    }

    /**
     * Update user profile picture
     */
    public function updateProfilePicture(Request $request)
    {
        $request->validate([
            'image' => [
                'required',
                'image',
                'mimes:jpeg,png,jpg,gif',
                'max:2048' // 2MB limit
            ]
        ]);

        $user = $request->user();

        // 🛡️ CLOUDINARY INTEGRATION: The "Render Persistence" fix
        $cloudName = env('CLOUDINARY_CLOUD_NAME');
        $apiKey = env('CLOUDINARY_API_KEY');
        $apiSecret = env('CLOUDINARY_API_SECRET');

        if (!$cloudName || !$apiKey || !$apiSecret) {
             return response()->json(['message' => 'Cloudinary not configured on this server.'], 500);
        }

        try {
            $file = $request->file('image');
            $timestamp = time();
            
            // 🛡️ SECURE SIGNATURE: Ensures only your server can upload to your account
            // Alphabetical order of parameters is required for the signature string
            $paramsToSign = "folder=profile_photos&timestamp={$timestamp}{$apiSecret}";
            $signature = sha1($paramsToSign);

            // 🚀 ZERO-DEPENDENCY UPLOAD: Use built-in Laravel Http client
            $response = \Illuminate\Support\Facades\Http::attach(
                'file', 
                file_get_contents($file->getRealPath()), 
                $file->getClientOriginalName()
            )->post("https://api.cloudinary.com/v1_1/{$cloudName}/image/upload", [
                'api_key' => $apiKey,
                'timestamp' => $timestamp,
                'signature' => $signature,
                'folder' => 'profile_photos'
            ]);

            if (!$response->successful()) {
                return response()->json(['message' => 'Cloud upload failed: ' . $response->json()['error']['message']], 500);
            }

            $cloudinaryData = $response->json();
            $secureUrl = $cloudinaryData['secure_url']; // Full HTTPS URL

            // Cleanup local file if it was a legacy storage path
            if ($user->profile_photo_path && !str_starts_with($user->profile_photo_path, 'http')) {
                Storage::disk('public')->delete($user->profile_photo_path);
            }

            $user->profile_photo_path = $secureUrl;
            $user->save();

            return response()->json([
                'message' => 'Profile picture secured in the cloud!',
                'user' => $user,
                'url' => $secureUrl
            ], 200);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Server Error: ' . $e->getMessage()], 500);
        }
    }


    /**
     * Fetch all registered dentists with full data
     */
    public function getDentists()
    {
        try {
            // 🛡️ FULL-DATA FETCH: Include name, email, specialization, and photo
            $dentists = User::where('role', 'admin')
                            ->select('id', 'name', 'email', 'profile_photo_path', 'specialization') 
                            ->get();



            return response()->json(['dentists' => $dentists], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Update profile information
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                'unique:users,email,' . $user->id, 
                'regex:/^[a-z0-9._%+-]+@(gmail\.com|yahoo\.com|tip\.edu\.ph)$/i'
            ],
            'phone' => [
                'required',
                'digits:11', 
                'unique:users,phone,' . $user->id,
                'regex:/^09[0-9]{9}$/' 
            ],
            'specialization' => 'nullable|string|max:255',
            'hmo_provider' => 'nullable|string|in:Medicard,Maxicare,None',
        ], [
            'phone.digits' => 'Phone number must be exactly 11 digits.',
            'phone.regex' => 'Please use a valid Philippine mobile format (09XXXXXXXXX).',
            'email.regex' => 'Please use a valid email (Gmail, Yahoo, or TIP only).',
        ]);

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'specialization' => $request->specialization,
            'hmo_provider' => $request->hmo_provider,
        ]);

        return response()->json(['message' => 'Profile updated!', 'user' => $user->fresh()], 200);
    }

    /**
     * Upload and save HMO Card to Cloudinary
     */
    public function updateHmoCard(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        $user = $request->user();

        $cloudName = env('CLOUDINARY_CLOUD_NAME');
        $apiKey = env('CLOUDINARY_API_KEY');
        $apiSecret = env('CLOUDINARY_API_SECRET');

        if (!$cloudName || !$apiKey || !$apiSecret) {
             return response()->json(['message' => 'Cloudinary not configured.'], 500);
        }

        try {
            $file = $request->file('image');
            $timestamp = time();
            $paramsToSign = "folder=hmo_cards&timestamp={$timestamp}{$apiSecret}";
            $signature = sha1($paramsToSign);

            $response = \Illuminate\Support\Facades\Http::attach(
                'file', 
                file_get_contents($file->getRealPath()), 
                $file->getClientOriginalName()
            )->post("https://api.cloudinary.com/v1_1/{$cloudName}/image/upload", [
                'api_key' => $apiKey,
                'timestamp' => $timestamp,
                'signature' => $signature,
                'folder' => 'hmo_cards'
            ]);

            if (!$response->successful()) {
                return response()->json(['message' => 'HMO Card upload failed.'], 500);
            }

            $cloudinaryData = $response->json();
            $secureUrl = $cloudinaryData['secure_url'];

            // Cleanup local file if it exists
            if ($user->hmo_card_path && !str_starts_with($user->hmo_card_path, 'http')) {
                Storage::disk('public')->delete($user->hmo_card_path);
            }

            $user->hmo_card_path = $secureUrl;
            $user->save();

            return response()->json([
                'message' => 'HMO Card secured in the cloud!',
                'user' => $user,
                'url' => $secureUrl
            ], 200);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Server Error: ' . $e->getMessage()], 500);
        }
    }


    /**
     * Change password
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();

        // 'bail' stops at the first failure. 
        // We also separate the 'confirmed' check to prioritize it.
        $request->validate([
            'current_password' => 'required|bail',
            'password' => 'required|min:8|confirmed',
        ], [
            'current_password.required' => 'The current password field is required.',
            'password.confirmed' => 'The password confirmation does not match.',
            'password.min' => 'Your new password must be at least 8 characters.',
        ]);

        // THE CHALLENGE: Verify the old password
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'The current password you entered is incorrect.'
            ], 422);
        }

        // SUCCESS: Update to the new hashed password
        $user->update([
            'password' => Hash::make($request->password)
        ]);

        return response()->json([
            'message' => 'Password updated successfully!'
        ], 200);
    }
}