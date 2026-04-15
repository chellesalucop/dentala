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

echo "Testing Appointment Email Flow...\n";

// Create a test appointment object
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
    echo "1. Testing Patient Email Notification...\n";
    Mail::to($testAppointment->email)->queue(new PatientNotificationMail($testAppointment, 'pending', '', 'Dr. Test Dentist'));
    echo "   Patient email queued successfully!\n";
    
    echo "2. Testing Admin Email Notification...\n";
    Mail::to($testAppointment->preferred_dentist)->queue(new AdminNotificationMail($testAppointment, 'New Booking'));
    echo "   Admin email queued successfully!\n";
    
    echo "3. Checking queue status...\n";
    $jobs = \Illuminate\Support\Facades\DB::table('jobs')->count();
    echo "   Jobs in queue: $jobs\n";
    
    echo "\nEmails have been queued for background processing.\n";
    echo "The queue worker should process them within a few seconds.\n";
    echo "Check your inbox at poculas.nna@gmail.com and mrasalucop01@tip.edu.ph\n";
    
} catch (\Exception $e) {
    echo "Email test failed: " . $e->getMessage() . "\n";
    echo "Error trace: " . $e->getTraceAsString() . "\n";
}
