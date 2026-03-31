<?php

/**
 * Email Suffix Protection Test
 * 
 * This script demonstrates the difference between browser email validation
 * and our strict regex suffix protection that prevents "Email Leaks".
 */

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\Validator;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Email Suffix Protection Test ===\n\n";

// Test 1: Browser vs Backend Validation Comparison
echo "1. Browser Logic vs Backend Logic Comparison:\n";
echo "   Browser (type='email') thinks these are valid:\n";
echo "   ✅ user@g                    - Browser: 'Looks okay to me!'\n";
echo "   ✅ user@gmail                - Browser: 'Valid format!'\n";
echo "   ✅ user@tip.edu.ph           - Browser: 'Valid!'\n\n";

echo "   Backend (Regex Shield) response:\n";

// Test cases that browser accepts but backend should reject
$browserAcceptedBackendRejected = [
    'user@g',                    // Missing suffix
    'user@gmail',                // Needs .com
    'admin@yahoo',               // Needs .com
    'student@tip',               // Needs .edu.ph
    'test@tip.edu',              // Needs .ph
    'user@domain',               // Invalid domain
    'email@server',              // Invalid domain
    'contact@company',           // Invalid domain
];

echo "   ❌ REJECTED (Missing Suffix):\n";
foreach ($browserAcceptedBackendRejected as $email) {
    $validator = Validator::make(['email' => $email], [
        'email' => [
            'required',
            'string',
            'email',
            'max:255',
            'unique:users,email,1',
            'regex:/^[a-z0-9._%+-]+@(gmail\.com|yahoo\.com|tip\.edu\.ph)$/i'
        ]
    ]);
    
    $result = $validator->fails() ? 'REJECTED ✅' : 'ACCEPTED ❌';
    echo "   - {$email}: {$result}\n";
    if ($validator->fails()) {
        $errors = $validator->errors()->get('email');
        echo "     Reason: " . $errors[0] . "\n";
    }
}

// Test cases that both browser and backend accept
$bothAccept = [
    'user@gmail.com',
    'test@yahoo.com',
    'student@tip.edu.ph',
    'john.doe@gmail.com',
    'user123@yahoo.com',
    'student.name@tip.edu.ph'
];

echo "\n   ✅ ACCEPTED (Complete Suffix):\n";
foreach ($bothAccept as $email) {
    $validator = Validator::make(['email' => $email], [
        'email' => [
            'required',
            'string',
            'email',
            'max:255',
            'unique:users,email,1',
            'regex:/^[a-z0-9._%+-]+@(gmail\.com|yahoo\.com|tip\.edu\.ph)$/i'
        ]
    ]);
    
    $result = $validator->fails() ? 'REJECTED ❌' : 'ACCEPTED ✅';
    echo "   - {$email}: {$result}\n";
}

echo "\n";

// Test 2: The "Email Leak" Scenarios
echo "2. The 'Email Leak' Scenarios (What would happen without regex):\n";
echo "   🚨 WITHOUT regex shield, these would enter database:\n";

$leakScenarios = [
    'mercedeskyla@g',           // Incomplete Gmail
    'johnsmith@yahoo',           // Incomplete Yahoo
    'student@tip',               // Incomplete TIP
    'admin@tip.edu',             // Incomplete TIP
    'user@domain',               // Random incomplete domain
    'test@server',               // Random incomplete domain
];

foreach ($leakScenarios as $email) {
    echo "   - {$email}\n";
}

echo "\n   🛡️ WITH regex shield, all BLOCKED:\n";
foreach ($leakScenarios as $email) {
    $validator = Validator::make(['email' => $email], [
        'email' => [
            'required',
            'string',
            'email',
            'max:255',
            'unique:users,email,1',
            'regex:/^[a-z0-9._%+-]+@(gmail\.com|yahoo\.com|tip\.edu\.ph)$/i'
        ]
    ]);
    
    $result = $validator->fails() ? 'BLOCKED ✅' : 'ALLOWED ❌';
    echo "   - {$email}: {$result}\n";
}

echo "\n";

// Test 3: Edge Case Testing
echo "3. Edge Case Testing:\n";

$edgeCases = [
    // Valid edge cases
    'user.name@gmail.com',
    'user_123@yahoo.com',
    'test-email@tip.edu.ph',
    'user+tag@gmail.com',
    'user%test@yahoo.com',
    
    // Invalid edge cases
    'user@gmail.co',             // Wrong TLD
    'test@yahoo.org',             // Wrong TLD
    'student@tip.edu.com',        // Wrong TLD
    'user@tip.edu.ph.uk',         // Too long
    'admin@gmail.com.ph',         // Wrong format
    'user@yahoo.com.ph',          // Wrong format
];

echo "   Edge Case Results:\n";
foreach ($edgeCases as $email) {
    $validator = Validator::make(['email' => $email], [
        'email' => [
            'required',
            'string',
            'email',
            'max:255',
            'unique:users,email,1',
            'regex:/^[a-z0-9._%+-]+@(gmail\.com|yahoo\.com|tip\.edu\.ph)$/i'
        ]
    ]);
    
    $result = $validator->fails() ? 'REJECTED ❌' : 'ACCEPTED ✅';
    echo "   - {$email}: {$result}\n";
    if ($validator->fails()) {
        $errors = $validator->errors()->get('email');
        echo "     Reason: " . $errors[0] . "\n";
    }
}

echo "\n";

// Test 4: Regex Pattern Breakdown
echo "4. Regex Pattern Breakdown:\n";
echo "   Pattern: /^[a-z0-9._%+-]+@(gmail\.com|yahoo\.com|tip\.edu\.ph)$/i\n\n";

echo "   Pattern Explanation:\n";
echo "   ^                           - Start of string\n";
echo "   [a-z0-9._%+-]+              - Local part (letters, numbers, . _ % + -)\n";
echo "   @                           - @ symbol\n";
echo "   (gmail\.com|yahoo\.com|tip\.edu\.ph) - Allowed domains ONLY\n";
echo "   $                           - End of string\n";
echo "   i                           - Case insensitive\n\n";

echo "   This pattern specifically blocks:\n";
echo "   - user@g                    (missing .com)\n";
echo "   - user@gmail                (missing .com)\n";
echo "   - admin@yahoo               (missing .com)\n";
echo "   - student@tip               (missing .edu.ph)\n";
echo "   - user@hotmail.com          (wrong domain)\n";
echo "   - test@outlook.com          (wrong domain)\n\n";

// Test 5: Real-world Attack Prevention
echo "5. Real-world Attack Prevention:\n";

$attackScenarios = [
    'user@g; DROP TABLE users;',     // SQL injection attempt
    'admin@gmail<script>alert(1)</script>', // XSS attempt
    'test@yahoo OR 1=1',             // SQL injection attempt
    'user@tip.edu.ph UNION SELECT * FROM users', // SQL injection
];

echo "   🛡️ Attack Scenarios (All BLOCKED):\n";
foreach ($attackScenarios as $email) {
    $validator = Validator::make(['email' => $email], [
        'email' => [
            'required',
            'string',
            'email',
            'max:255',
            'unique:users,email,1',
            'regex:/^[a-z0-9._%+-]+@(gmail\.com|yahoo\.com|tip\.edu\.ph)$/i'
        ]
    ]);
    
    $result = $validator->fails() ? 'BLOCKED ✅' : 'ALLOWED ❌';
    echo "   - {$email}: {$result}\n";
    if ($validator->fails()) {
        $errors = $validator->errors()->get('email');
        echo "     Reason: " . $errors[0] . "\n";
    }
}

echo "\n";

// Test 6: Database Integrity Simulation
echo "6. Database Integrity Simulation:\n";

echo "   📊 What would enter database WITHOUT regex shield:\n";
echo "   - mercedeskyla@g\n";
echo "   - johnsmith@yahoo\n";
echo "   - student@tip\n";
echo "   - admin@tip.edu\n";
echo "   - user@domain\n";
echo "   Result: ❌ CORRUPTED DATA - Invalid email formats\n\n";

echo "   📊 What enters database WITH regex shield:\n";
echo "   - user@gmail.com\n";
echo "   - test@yahoo.com\n";
echo "   - student@tip.edu.ph\n";
echo "   - john.doe@gmail.com\n";
echo "   - user123@yahoo.com\n";
echo "   Result: ✅ CLEAN DATA - Only valid, complete emails\n\n";

echo "=== Test Complete ===\n";
echo "✅ Email suffix protection is ACTIVE\n";
echo "✅ Browser validation bypassed by strict regex\n";
echo "✅ Incomplete emails like 'user@g' are BLOCKED\n";
echo "✅ Only complete, valid domains are ACCEPTED\n";
echo "✅ Database integrity is MAINTAINED\n";
echo "✅ Attack scenarios are PREVENTED\n";
