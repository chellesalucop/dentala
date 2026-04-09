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
            'encryption' => env('MAIL_ENCRYPTION', 'not set'),
            'from_address' => env('MAIL_FROM_ADDRESS', 'not set'),
            'from_name' => env('MAIL_FROM_NAME', 'not set'),
        ];
        
        // Create a simple test email
        $testEmail = new \stdClass();
        $testEmail->to = 'test@example.com';
        $testEmail->subject = 'Dentala Email Test';
        $testEmail->body = 'This is a test email from Dentala application.';
        
        // Try to send email
        Mail::raw('This is a test email from Dentala application.', function ($message) {
            $message->to('test@example.com')
                   ->subject('Dentala Email Test')
                   ->from(env('MAIL_FROM_ADDRESS', 'noreply@dentala.com'), env('MAIL_FROM_NAME', 'Dentala'));
        });
        
        return response()->json([
            'status' => 'success',
            'message' => 'Test email sent successfully',
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
