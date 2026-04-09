<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\PatientNotificationMail;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Testing Brevo Email Configuration...\n";
echo "Host: " . config('mail.mailers.smtp.host') . "\n";
echo "Username: " . config('mail.mailers.smtp.username') . "\n";
echo "From: " . config('mail.from.address') . "\n";
echo "Port: " . config('mail.mailers.smtp.port') . "\n";
echo "Encryption: " . config('mail.mailers.smtp.encryption') . "\n";

// Create a test appointment object
$testAppointment = new stdClass();
$testAppointment->full_name = "Test Patient";
$testAppointment->email = "poculas.nna@gmail.com";
$testAppointment->preferred_dentist = "mrasalucop01@tip.edu.ph";
$testAppointment->service_type = "Test Service";
$testAppointment->custom_service = "";
$testAppointment->appointment_date = "2026-04-10";
$testAppointment->preferred_time = "07:00 AM";
$testAppointment->status = "pending";
$testAppointment->hmo_provider = "None";

try {
    echo "Sending test email...\n";
    Mail::to("poculas.nna@gmail.com")->send(new PatientNotificationMail($testAppointment, 'pending', '', 'Test Dentist'));
    echo "Email sent successfully!\n";
} catch (\Exception $e) {
    echo "Email sending failed: " . $e->getMessage() . "\n";
    echo "Error trace: " . $e->getTraceAsString() . "\n";
}
