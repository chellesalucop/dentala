<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Mail;
use App\Mail\PatientNotificationMail;
use App\Mail\AdminNotificationMail;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== TESTING COMPLETE EMAIL FLOW ===\n\n";

// Test 1: Patient creates appointment
echo "1. Testing: Patient creates new appointment\n";
echo "   Expected: Dentist receives 'New Booking' email\n";

$testAppointment = new stdClass();
$testAppointment->full_name = "Test Patient";
$testAppointment->email = "poculas.nna@gmail.com";
$testAppointment->preferred_dentist = "mrasalucop01@tip.edu.ph";
$testAppointment->service_type = "Regular Checkup";
$testAppointment->custom_service = "";
$testAppointment->appointment_date = date('Y-m-d', strtotime('+1 day'));
$testAppointment->preferred_time = "10:00 AM";
$testAppointment->status = "pending";
$testAppointment->hmo_provider = "None";

try {
    // Send dentist notification (New Booking)
    Mail::to($testAppointment->preferred_dentist)->queue(new AdminNotificationMail($testAppointment, 'New Booking'));
    echo "   ✅ Dentist email queued successfully\n";
    
    // Send patient notification (pending)
    $dentist = \App\Models\User::where('email', $testAppointment->preferred_dentist)->first();
    $dentistName = $dentist ? $dentist->name : 'Dentala Clinic Specialist';
    Mail::to($testAppointment->email)->queue(new PatientNotificationMail($testAppointment, 'pending', '', $dentistName));
    echo "   ✅ Patient email queued successfully\n";
} catch (\Exception $e) {
    echo "   ❌ Error: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 2: Patient confirms appointment
echo "2. Testing: Patient confirms appointment\n";
echo "   Expected: Dentist receives 'Patient Confirmed' email\n";

try {
    $testAppointment->status = 'confirmed';
    Mail::to($testAppointment->preferred_dentist)->queue(new AdminNotificationMail($testAppointment, 'Patient Confirmed'));
    echo "   ✅ Dentist confirmation email queued successfully\n";
} catch (\Exception $e) {
    echo "   ❌ Error: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 3: Dentist approves appointment
echo "3. Testing: Dentist approves appointment\n";
echo "   Expected: Patient receives 'Appointment Confirmed' email\n";

try {
    $testAppointment->status = 'confirmed';
    $dentist = \App\Models\User::where('email', $testAppointment->preferred_dentist)->first();
    $dentistName = $dentist ? $dentist->name : 'Dentala Clinic Specialist';
    Mail::to($testAppointment->email)->queue(new PatientNotificationMail($testAppointment, 'confirmed', '', $dentistName));
    echo "   ✅ Patient approval email queued successfully\n";
} catch (\Exception $e) {
    echo "   ❌ Error: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 4: Dentist declines appointment
echo "4. Testing: Dentist declines appointment\n";
echo "   Expected: Patient receives 'Appointment Declined' email\n";

try {
    $testAppointment->status = 'declined';
    $dentist = \App\Models\User::where('email', $testAppointment->preferred_dentist)->first();
    $dentistName = $dentist ? $dentist->name : 'Dentala Clinic Specialist';
    Mail::to($testAppointment->email)->queue(new PatientNotificationMail($testAppointment, 'declined', 'Time slot not available', $dentistName));
    echo "   ✅ Patient decline email queued successfully\n";
} catch (\Exception $e) {
    echo "   ❌ Error: " . $e->getMessage() . "\n";
}

echo "\n";

// Check queue status
echo "5. Checking queue status\n";
$jobs = \Illuminate\Support\Facades\DB::table('jobs')->count();
echo "   Jobs in queue: $jobs\n";

echo "\n=== TEST COMPLETE ===\n";
echo "Emails have been queued for background processing.\n";
echo "The queue worker should process them within 3-10 seconds.\n";
echo "\nCheck your inboxes:\n";
echo "📧 Patient: poculas.nna@gmail.com\n";
echo "👨‍⚕️  Dentist: mrasalucop01@tip.edu.ph\n";
echo "\nExpected emails:\n";
echo "1. 'Action Required: New Booking Request' (dentist)\n";
echo "2. 'Appointment Received - Pending Approval' (patient)\n";
echo "3. 'Alert: Patient Confirmed Appointment' (dentist)\n";
echo "4. 'Appointment Confirmed' (patient)\n";
echo "5. 'Appointment Declined' (patient)\n";
