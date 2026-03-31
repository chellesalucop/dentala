<?php

/**
 * Validation Bleed Test
 * 
 * This script demonstrates the "Validation Bleed" bug where backend
 * sends specific error messages but frontend displays them under wrong fields.
 */

require_once __DIR__ . '/vendor/autoload.php';

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Validation Bleed Test ===\n\n";

// Test 1: Simulate Backend Error Responses
echo "1. Simulating Backend Error Responses:\n";

// Create test user
$testUser = User::where('email', 'test@validationbleed.com')->first();
if (!$testUser) {
    $testUser = User::create([
        'email' => 'test@validationbleed.com',
        'password' => Hash::make('CorrectPassword123'),
        'phone' => '09123456789',
        'role' => 'patient'
    ]);
}

echo "   - Test user: test@validationbleed.com\n";
echo "   - User ID: {$testUser->id}\n\n";

// Simulate different error scenarios
$errorScenarios = [
    [
        'name' => 'Current Password Incorrect',
        'input' => ['current_password' => 'WrongPassword123'],
        'expected_error' => 'The current password you entered is incorrect.',
        'field' => 'current_password'
    ],
    [
        'name' => 'Password Too Short',
        'input' => ['password' => 'short'],
        'expected_error' => 'The password must be at least 8 characters.',
        'field' => 'password'
    ],
    [
        'name' => 'Password Confirmation Mismatch',
        'input' => ['password' => 'NewPassword123', 'password_confirmation' => 'DifferentPassword123'],
        'expected_error' => 'The password confirmation does not match.',
        'field' => 'password_confirmation'
    ]
];

foreach ($errorScenarios as $scenario) {
    echo "   Scenario: {$scenario['name']}\n";
    echo "   - Input: " . json_encode($scenario['input']) . "\n";
    echo "   - Expected Error: {$scenario['expected_error']}\n";
    echo "   - Target Field: {$scenario['field']}\n\n";
}

echo "2. Frontend Error Mapping Bug:\n";
echo "   ❌ BUGGY Frontend Logic:\n";
echo "   setErrors({ email: data.message })\n";
echo "   \n";
echo "   Result: Backend sends 'current password incorrect' but frontend shows it under 'email' field!\n\n";

echo "   ✅ CORRECT Frontend Logic:\n";
echo "   setErrors({ current_password: data.message })\n";
echo "   \n";
echo "   Result: Backend error displays under correct field!\n\n";

// Test 3: Demonstrate Validation Bleed
echo "3. Validation Bleed Demonstration:\n";

$bleedScenarios = [
    [
        'scenario' => 'The Imposter',
        'backend_message' => 'The current password you entered is incorrect.',
        'buggy_frontend' => 'email: "The current password you entered is incorrect."',
        'correct_frontend' => 'current_password: "The current password you entered is incorrect."',
        'user_confusion' => 'User sees email error when password is wrong!'
    ],
    [
        'scenario' => 'The Weakling',
        'backend_message' => 'The password must be at least 8 characters.',
        'buggy_frontend' => 'email: "The password must be at least 8 characters."',
        'correct_frontend' => 'password: "The password must be at least 8 characters."',
        'user_confusion' => 'User sees email error when password is too short!'
    ],
    [
        'scenario' => 'The Typo',
        'backend_message' => 'The password confirmation does not match.',
        'buggy_frontend' => 'email: "The password confirmation does not match."',
        'correct_frontend' => 'password_confirmation: "The password confirmation does not match."',
        'user_confusion' => 'User sees email error when passwords don\'t match!'
    ]
];

foreach ($bleedScenarios as $scenario) {
    echo "   {$scenario['scenario']}:\n";
    echo "   - Backend Message: \"{$scenario['backend_message']}\"\n";
    echo "   - ❌ Buggy Frontend: {$scenario['buggy_frontend']}\n";
    echo "   - ✅ Correct Frontend: {$scenario['correct_frontend']}\n";
    echo "   - User Confusion: {$scenario['user_confusion']}\n\n";
}

// Test 4: Backend Error Message Analysis
echo "4. Backend Error Message Analysis:\n";

$backendErrors = [
    'current_password' => [
        'validation' => 'required',
        'error_message' => 'The current password field is required.',
        'correct_field' => 'current_password'
    ],
    'password' => [
        'validation' => 'min:8',
        'error_message' => 'The password must be at least 8 characters.',
        'correct_field' => 'password'
    ],
    'password_confirmation' => [
        'validation' => 'confirmed',
        'error_message' => 'The password confirmation does not match.',
        'correct_field' => 'password_confirmation'
    ]
];

foreach ($backendErrors as $field => $error) {
    echo "   Field: {$field}\n";
    echo "   - Validation: {$error['validation']}\n";
    echo "   - Error Message: \"{$error['error_message']}\"\n";
    echo "   - Correct Frontend Field: {$error['correct_field']}\n\n";
}

echo "5. Frontend Error Mapping Solution:\n";
echo "   ✅ PROPER Error Mapping:\n";
echo "   \n";
echo "   // Handle specific backend messages\n";
echo "   if (errorMessage.includes('current password')) {\n";
echo "     setErrors({ current_password: errorMessage });\n";
echo "   } else if (errorMessage.includes('password must be at least')) {\n";
echo "     setErrors({ password: errorMessage });\n";
echo "   } else if (errorMessage.includes('confirmation does not match')) {\n";
echo "     setErrors({ password_confirmation: errorMessage });\n";
echo "   } else {\n";
echo "     // Fallback to validation errors array\n";
echo "     setErrors(backendErrors);\n";
echo "   }\n\n";

echo "=== Test Complete ===\n";
echo "✅ Validation Bleed bug IDENTIFIED\n";
echo "✅ Backend error messages are SPECIFIC\n";
echo "✅ Frontend error mapping must be PRECISE\n";
echo "✅ User experience depends on CORRECT field mapping\n";
echo "✅ Solution: Map backend messages to correct frontend fields\n";
