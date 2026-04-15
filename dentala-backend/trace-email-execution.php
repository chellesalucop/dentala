<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Email Execution Path Tracer ===\n\n";

// 1. Test the exact conditional logic from AppointmentController
echo "1. Testing Appointment Creation Email Logic:\n";

// Get a recent appointment to test with
$appointment = \App\Models\Appointment::find(53);
if ($appointment) {
    echo "Testing with appointment ID 53:\n";
    echo "- Patient email: " . $appointment->email . "\n";
    echo "- Dentist email: " . $appointment->preferred_dentist . "\n";
    
    // Test the conditional logic
    $emailsDifferent = strtolower($appointment->preferred_dentist) !== strtolower($appointment->email);
    echo "- Admin email condition (emails different): " . ($emailsDifferent ? 'TRUE' : 'FALSE') . "\n";
    
    if ($emailsDifferent) {
        echo "  Admin notification SHOULD be sent to: " . $appointment->preferred_dentist . "\n";
    } else {
        echo "  Admin notification SKIPPED (same email as patient)\n";
    }
    
    echo "- Patient notification SHOULD be sent to: " . $appointment->email . "\n";
}

echo "\n";

// 2. Check if the email sending code is actually being executed
echo "2. Testing Direct Email Sending (mimicking controller logic):\n";

try {
    $dentist = \App\Models\User::where('email', $appointment->preferred_dentist)->first();
    $dentistName = $dentist ? $dentist->name : 'Dentala Clinic Specialist';
    
    echo "Found dentist: " . ($dentist ? $dentist->name : 'Not found') . "\n";
    echo "Using dentist name: " . $dentistName . "\n";
    
    // Test admin notification logic
    if (strtolower($appointment->preferred_dentist) !== strtolower($appointment->email)) {
        echo "Sending admin notification...\n";
        \Illuminate\Support\Facades\Mail::to($appointment->preferred_dentist)
            ->send(new \App\Mail\AdminNotificationMail($appointment, 'New Booking'));
        echo "Admin notification sent\n";
    }
    
    // Test patient notification logic
    echo "Sending patient notification...\n";
    \Illuminate\Support\Facades\Mail::to($appointment->email)
        ->send(new \App\Mail\PatientNotificationMail($appointment, 'pending', '', $dentistName));
    echo "Patient notification sent\n";
    
} catch (Exception $e) {
    echo "Email sending failed: " . $e->getMessage() . "\n";
    echo "Error trace: " . $e->getTraceAsString() . "\n";
}

echo "\n";

// 3. Check if there's a deployment issue
echo "3. Deployment Check:\n";
echo "Current working directory: " . getcwd() . "\n";
echo "APP_ENV: " . config('app.env') . "\n";
echo "APP_DEBUG: " . (config('app.debug') ? 'true' : 'false') . "\n";

// Check if the controller code is the current version
$controllerFile = 'app/Http/Controllers/Api/AppointmentController.php';
$controllerContent = file_get_contents($controllerFile);

if (strpos($controllerContent, 'Email configuration - Host') !== false) {
    echo "Controller has debug logging code\n";
} else {
    echo "Controller MISSING debug logging code (deployment issue!)\n";
}

if (strpos($controllerContent, 'strtolower($appointment->preferred_dentist) !== strtolower($appointment->email)') !== false) {
    echo "Controller has email conditional logic\n";
} else {
    echo "Controller MISSING email conditional logic\n";
}

echo "\n";

// 4. Test the status update logic
echo "4. Testing Status Update Email Logic:\n";

// Simulate status update
$testStatus = 'confirmed';
echo "Testing status update to: " . $testStatus . "\n";

try {
    $dentist = \App\Models\User::where('email', $appointment->preferred_dentist)->first();
    $dentistName = $dentist ? $dentist->name : 'Dentala Clinic Specialist';

    \Illuminate\Support\Facades\Mail::to($appointment->email)->send(new \App\Mail\PatientNotificationMail(
        $appointment, 
        $testStatus, 
        '', 
        $dentistName
    ));
    echo "Status update email sent successfully\n";
    
} catch (Exception $e) {
    echo "Status update email failed: " . $e->getMessage() . "\n";
}

echo "\n=== Trace Complete ===\n";
