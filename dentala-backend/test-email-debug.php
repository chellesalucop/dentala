<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Mail;
use App\Mail\PatientNotificationMail;
use App\Mail\AdminNotificationMail;
use App\Models\Appointment;

echo "=== Dentala Email System Debug ===\n\n";

// 1. Test basic mail configuration
echo "1. Testing Mail Configuration...\n";
echo "MAIL_MAILER: " . config('mail.default') . "\n";
echo "MAIL_HOST: " . config('mail.mailers.smtp.host') . "\n";
echo "MAIL_PORT: " . config('mail.mailers.smtp.port') . "\n";
echo "MAIL_USERNAME: " . config('mail.mailers.smtp.username') . "\n";
echo "MAIL_FROM_ADDRESS: " . config('mail.from.address') . "\n";
echo "MAIL_ENCRYPTION: " . config('mail.mailers.smtp.encryption') . "\n\n";

// 2. Test basic email sending
echo "2. Testing Basic Email Sending...\n";
try {
    Mail::raw('This is a test email from Dentala system.', function($message) {
        $message->to('test@example.com')
                ->subject('Dentala Email Test - ' . date('Y-m-d H:i:s'));
    });
    echo "Basic email sent successfully!\n";
} catch (Exception $e) {
    echo "Basic email failed: " . $e->getMessage() . "\n";
    echo "Error trace: " . $e->getTraceAsString() . "\n";
}
echo "\n";

// 3. Test with a sample appointment
echo "3. Testing Appointment Email Templates...\n";
try {
    $sampleAppointment = new stdClass();
    $sampleAppointment->id = 999;
    $sampleAppointment->full_name = 'Test Patient';
    $sampleAppointment->email = 'test@example.com';
    $sampleAppointment->phone = '12345678901';
    $sampleAppointment->service_type = 'Regular Checkup';
    $sampleAppointment->preferred_dentist = 'dentist@example.com';
    $sampleAppointment->appointment_date = '2026-04-15';
    $sampleAppointment->preferred_time = '10:00 AM';
    $sampleAppointment->status = 'pending';
    
    echo "Testing PatientNotificationMail...\n";
    Mail::to('test@example.com')->send(new PatientNotificationMail($sampleAppointment, 'pending', '', 'Dr. Test Dentist'));
    echo "PatientNotificationMail sent successfully!\n";
    
    echo "Testing AdminNotificationMail...\n";
    Mail::to('dentist@example.com')->send(new AdminNotificationMail($sampleAppointment, 'New Booking'));
    echo "AdminNotificationMail sent successfully!\n";
    
} catch (Exception $e) {
    echo "Appointment email failed: " . $e->getMessage() . "\n";
    echo "Error trace: " . $e->getTraceAsString() . "\n";
}
echo "\n";

// 4. Check recent appointments
echo "4. Checking Recent Appointments...\n";
try {
    $recentAppointments = \App\Models\Appointment::orderBy('created_at', 'desc')->limit(3)->get();
    echo "Found " . $recentAppointments->count() . " recent appointments:\n";
    
    foreach ($recentAppointments as $apt) {
        echo "- ID: {$apt->id}, Status: {$apt->status}, Email: {$apt->email}, Dentist: {$apt->preferred_dentist}\n";
    }
} catch (Exception $e) {
    echo "Failed to get appointments: " . $e->getMessage() . "\n";
}

echo "\n=== Debug Complete ===\n";
