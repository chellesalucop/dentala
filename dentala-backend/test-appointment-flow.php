<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Mail;
use App\Mail\PatientNotificationMail;
use App\Mail\AdminNotificationMail;
use App\Models\Appointment;

echo "=== Testing Real Appointment Email Flow ===\n\n";

// 1. Get a real appointment from the database
$appointment = \App\Models\Appointment::find(51);

if (!$appointment) {
    echo "No appointment found with ID 51. Creating a test appointment...\n";
    
    // Create a test appointment
    $appointment = \App\Models\Appointment::create([
        'user_id' => 1,
        'full_name' => 'Test Patient',
        'phone' => '12345678901',
        'email' => 'poculas.nna@gmail.com', // Use the actual email from logs
        'service_type' => 'Regular Checkup',
        'preferred_dentist' => 'mrasalucop01@tip.edu.ph',
        'appointment_date' => '2026-04-15',
        'preferred_time' => '10:00 AM',
        'status' => 'pending',
    ]);
    
    echo "Created test appointment with ID: " . $appointment->id . "\n";
} else {
    echo "Found existing appointment:\n";
    echo "- ID: {$appointment->id}\n";
    echo "- Status: {$appointment->status}\n";
    echo "- Email: {$appointment->email}\n";
    echo "- Dentist: {$appointment->preferred_dentist}\n";
    echo "- Service: {$appointment->service_type}\n\n";
}

// 2. Test patient booking email (like when patient clicks "confirm booking")
echo "2. Testing Patient Booking Confirmation Email...\n";
try {
    $dentist = \App\Models\User::where('email', $appointment->preferred_dentist)->first();
    $dentistName = $dentist ? $dentist->name : 'Dentala Clinic Specialist';
    
    echo "Sending to patient: {$appointment->email}\n";
    echo "Dentist name: {$dentistName}\n";
    
    Mail::to($appointment->email)->send(new PatientNotificationMail(
        $appointment, 
        'pending', 
        '', 
        $dentistName
    ));
    
    echo "Patient booking email sent successfully!\n";
} catch (Exception $e) {
    echo "Patient booking email failed: " . $e->getMessage() . "\n";
}

echo "\n";

// 3. Test admin notification email (sent to dentist)
echo "3. Testing Admin Notification Email (to Dentist)...\n";
try {
    echo "Sending to dentist: {$appointment->preferred_dentist}\n";
    
    Mail::to($appointment->preferred_dentist)->send(new AdminNotificationMail(
        $appointment, 
        'New Booking'
    ));
    
    echo "Admin notification email sent successfully!\n";
} catch (Exception $e) {
    echo "Admin notification email failed: " . $e->getMessage() . "\n";
}

echo "\n";

// 4. Test dentist approval email (like when dentist clicks "approve")
echo "4. Testing Dentist Approval Email (to Patient)...\n";
try {
    // Update status to confirmed
    $appointment->status = 'confirmed';
    $appointment->save();
    
    $dentist = \App\Models\User::where('email', $appointment->preferred_dentist)->first();
    $dentistName = $dentist ? $dentist->name : 'Dentala Clinic Specialist';
    
    Mail::to($appointment->email)->send(new PatientNotificationMail(
        $appointment, 
        'confirmed', 
        'Your appointment has been approved by the dentist.', 
        $dentistName
    ));
    
    echo "Dentist approval email sent successfully!\n";
} catch (Exception $e) {
    echo "Dentist approval email failed: " . $e->getMessage() . "\n";
}

echo "\n";

// 5. Test dentist rejection email (like when dentist clicks "reject")
echo "5. Testing Dentist Rejection Email (to Patient)...\n";
try {
    // Update status to declined
    $appointment->status = 'declined';
    $appointment->cancellation_reason = 'Schedule conflict - dentist not available';
    $appointment->save();
    
    $dentist = \App\Models\User::where('email', $appointment->preferred_dentist)->first();
    $dentistName = $dentist ? $dentist->name : 'Dentala Clinic Specialist';
    
    Mail::to($appointment->email)->send(new PatientNotificationMail(
        $appointment, 
        'declined', 
        'Your appointment has been declined due to: ' . $appointment->cancellation_reason, 
        $dentistName
    ));
    
    echo "Dentist rejection email sent successfully!\n";
} catch (Exception $e) {
    echo "Dentist rejection email failed: " . $e->getMessage() . "\n";
}

echo "\n=== Email Flow Test Complete ===\n";
echo "Check the email inboxes:\n";
echo "- Patient: {$appointment->email}\n";
echo "- Dentist: {$appointment->preferred_dentist}\n";
echo "- From address: " . config('mail.from.address') . "\n";
