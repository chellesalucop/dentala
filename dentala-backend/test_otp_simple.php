<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== OTP SIMPLE TEST ===" . PHP_EOL . PHP_EOL;

// Test sending OTP
try {
    $request = new \Illuminate\Http\Request();
    $request->merge(['email' => 'test@example.com']);
    
    $authController = new \App\Http\Controllers\Api\AuthController();
    $response = $authController->sendOtp($request);
    
    echo "Send OTP Result: " . json_decode($response->getContent())->message . PHP_EOL;
    echo "Status Code: {$response->getStatusCode()}" . PHP_EOL;
    
    if ($response->getStatusCode() === 200) {
        $content = json_decode($response->getContent(), true);
        if (isset($content['otp'])) {
            echo "✅ OTP Generated: {$content['otp']}" . PHP_EOL;
            echo "✅ Expires At: {$content['expires_at']}" . PHP_EOL;
        }
    }
    
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . PHP_EOL;
}

echo PHP_EOL . "✅ Test completed!" . PHP_EOL;
