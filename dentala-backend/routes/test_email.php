<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Mail;
use App\Mail\TestEmail;

Route::get('/test-email', function () {
    try {
        // Test email configuration
        $config = [
            'mailer' => env('MAIL_MAILER', 'not set'),
            'host' => env('MAIL_HOST', 'not set'),
            'port' => env('MAIL_PORT', 'not set'),
            'username' => env('MAIL_USERNAME', 'not set'),
            'password' => env('MAIL_PASSWORD') ? 'SET' : 'NOT SET',
            'encryption' => env('MAIL_ENCRYPTION', 'not set'),
            'from_address' => env('MAIL_FROM_ADDRESS', 'not set'),
            'from_name' => env('MAIL_FROM_NAME', 'not set'),
        ];
        
        // Test with actual recipient email
        $recipientEmail = 'poculas.nna@gmail.com'; // Use your actual email for testing
        
        // Try to send email
        Mail::raw('This is a test email from Dentala application. If you receive this, Brevo configuration is working!', function ($message) use ($recipientEmail) {
            $message->to($recipientEmail)
                   ->subject('Dentala Email Test - Brevo Configuration')
                   ->from(env('MAIL_FROM_ADDRESS', 'noreply@dentala.com'), env('MAIL_FROM_NAME', 'Dentala'));
        });
        
        return response()->json([
            'status' => 'success',
            'message' => 'Test email sent successfully to ' . $recipientEmail,
            'config' => $config
        ]);
        
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
            'config' => $config ?? []
        ], 500);
    }
});
