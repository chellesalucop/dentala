<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== OTP FUNCTIONALITY TEST ===" . PHP_EOL . PHP_EOL;

// Clean up any existing test data
DB::table('password_resets')->where('email', 'like', '%test%')->delete();

// Test cases for OTP functionality
$otpTests = [
    [
        'name' => 'Send OTP - Valid Email',
        'email' => 'test@example.com',
        'expected_status' => 200,
        'expected_message' => 'OTP sent successfully.',
        'description' => 'Valid email should generate and store OTP'
    ],
    [
        'name' => 'Send OTP - Invalid Email Format',
        'email' => 'not-an-email',
        'expected_status' => 422,
        'expected_message' => 'validation error',
        'description' => 'Invalid email format should fail validation'
    ],
    [
        'name' => 'Send OTP - Non-existent Email',
        'email' => 'nonexistent@example.com',
        'expected_status' => 200,
        'expected_message' => 'OTP sent successfully.',
        'description' => 'Non-existent email should return success for security'
    ]
];

foreach ($otpTests as $i => $test) {
    echo "Test " . ($i + 1) . ": {$test['name']}" . PHP_EOL;
    echo "Email: '{$test['email']}'" . PHP_EOL;
    echo "Expected: Status {$test['expected_status']} - {$test['description']}" . PHP_EOL;
    
    try {
        // Simulate send OTP request
        $request = new \Illuminate\Http\Request();
        $request->merge(['email' => $test['email']]);
        
        // Create an instance of AuthController
        $authController = new \App\Http\Controllers\Api\AuthController();
        
        // Call sendOtp method
        $response = $authController->sendOtp($request);
        
        echo "Result: ✅ SUCCESS" . PHP_EOL;
        echo "Status Code: {$response->getStatusCode()}" . PHP_EOL;
        echo "Message: " . json_decode($response->getContent())->message . PHP_EOL;
        
        if ($response->getStatusCode() === $test['expected_status']) {
            echo "✅ Status code matches expected" . PHP_EOL;
        } else {
            echo "❌ Status code mismatch. Expected: {$test['expected_status']}, Got: {$response->getStatusCode()}" . PHP_EOL;
        }
        
        // Store OTP for verification test
        if ($response->getStatusCode() === 200) {
            $content = json_decode($response->getContent(), true);
            if (isset($content['otp'])) {
                file_put_contents('test_otp.txt', $content['otp']);
                echo "✅ OTP saved for verification test: {$content['otp']}" . PHP_EOL;
            }
        }
        
    } catch (\Exception $e) {
        echo "Result: ❌ EXCEPTION" . PHP_EOL;
        echo "Error: " . $e->getMessage() . PHP_EOL;
        
        if (strpos($e->getMessage(), 'validation') !== false) {
            echo "✅ Validation error caught as expected" . PHP_EOL;
        }
    }
    
    echo str_repeat("-", 80) . PHP_EOL;
}

echo PHP_EOL . "=== OTP VERIFICATION TEST ===" . PHP_EOL;

// Get OTP from file for verification test
$otp = file_get_contents('test_otp.txt');
if ($otp) {
    echo "Using saved OTP for verification: $otp" . PHP_EOL;
    
    try {
        // Simulate verify OTP request
        $request = new \Illuminate\Http\Request();
        $request->merge([
            'email' => 'test@example.com',
            'otp' => $otp
        ]);
        
        $authController = new \App\Http\Controllers\Api\AuthController();
        $response = $authController->verifyOtp($request);
        
        echo "OTP Verification Result: " . json_decode($response->getContent())->message . PHP_EOL;
        echo "Status Code: {$response->getStatusCode()}" . PHP_EOL;
        
        if ($response->getStatusCode() === 200) {
            echo "✅ OTP verified successfully" . PHP_EOL;
            
            // Store verification token for password reset test
            $content = json_decode($response->getContent(), true);
            if (isset($content['verification_token'])) {
                file_put_contents('test_verification_token.txt', $content['verification_token']);
                echo "✅ Verification token saved: {$content['verification_token']}" . PHP_EOL;
            }
        }
    } catch (\Exception $e) {
        echo "❌ OTP Verification Error: " . $e->getMessage() . PHP_EOL;
    }
}

echo PHP_EOL . "=== PASSWORD RESET WITH VERIFICATION TOKEN TEST ===" . PHP_EOL;

// Get verification token for password reset test
$verificationToken = file_get_contents('test_verification_token.txt');
if ($verificationToken) {
    echo "Using saved verification token: $verificationToken" . PHP_EOL;
    
    try {
        // Simulate password reset request
        $request = new \Illuminate\Http\Request();
        $request->merge([
            'email' => 'test@example.com',
            'verification_token' => $verificationToken,
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123'
        ]);
        
        $authController = new \App\Http\Controllers\Api\AuthController();
        $response = $authController->resetPasswordWithOtp($request);
        
        echo "Password Reset Result: " . json_decode($response->getContent())->message . PHP_EOL;
        echo "Status Code: {$response->getStatusCode()}" . PHP_EOL;
        
        if ($response->getStatusCode() === 200) {
            echo "✅ Password reset successfully" . PHP_EOL;
        }
    } catch (\Exception $e) {
        echo "❌ Password Reset Error: " . $e->getMessage() . PHP_EOL;
    }
}

// Cleanup test files
if (file_exists('test_otp.txt')) unlink('test_otp.txt');
if (file_exists('test_verification_token.txt')) unlink('test_verification_token.txt');

echo PHP_EOL . "=== OTP SURFACE STATE MACHINE ===" . PHP_EOL;
echo "Surface Step | User Input | Action Trigger | Logic / Timer" . PHP_EOL;
echo "-------------|-------------|----------------|-------------" . PHP_EOL;
echo "1. Request | Enter Email | Send OTP | Backend checks email exists" . PHP_EOL;
echo "2. Verify | 6-Digit OTP | Auto-submit on 6th digit | 5:00 Timer. Resend resets clock." . PHP_EOL;
echo "3. Change | New Password | Change Password | min:8 and confirmed rules applied" . PHP_EOL;

echo PHP_EOL . "=== API ENDPOINTS ===" . PHP_EOL;
echo "POST /api/send-otp" . PHP_EOL;
echo "  Request: { email: 'user@example.com' }" . PHP_EOL;
echo "  Response: { message: 'OTP sent successfully.', otp: '123456', expires_at: '2023-03-23T13:45:00Z' }" . PHP_EOL;
echo "" . PHP_EOL;
echo "POST /api/verify-otp" . PHP_EOL;
echo "  Request: { email: 'user@example.com', otp: '123456' }" . PHP_EOL;
echo "  Response: { message: 'OTP verified successfully.', verification_token: 'abc123...' }" . PHP_EOL;
echo "" . PHP_EOL;
echo "POST /api/reset-password-otp" . PHP_EOL;
echo "  Request: { email, verification_token, password, password_confirmation }" . PHP_EOL;
echo "  Response: { message: 'Password has been reset.' }" . PHP_EOL;

echo PHP_EOL . "✅ Test completed!" . PHP_EOL;
