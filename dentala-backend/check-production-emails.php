<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Mail;
use App\Mail\PatientNotificationMail;
use App\Mail\AdminNotificationMail;
use App\Models\Appointment;

echo "=== Production Email Debug ===\n\n";

// 1. Check if deployment is using new code
echo "1. Checking deployment status...\n";
echo "Current template content check:\n";

$patientTemplate = file_get_contents('resources/views/emails/patient_notification.blade.php');
if (strpos($patientTemplate, 'custom_service ?? null') !== false) {
    echo "✅ Patient template has null fixes\n";
} else {
    echo "❌ Patient template NOT updated - deployment may not be complete\n";
}

$adminTemplate = file_get_contents('resources/views/emails/admin_notification.blade.php');
if (strpos($adminTemplate, 'custom_service ?? null') !== false) {
    echo "✅ Admin template has null fixes\n";
} else {
    echo "❌ Admin template NOT updated - deployment may not be complete\n";
}

echo "\n";

// 2. Test with a real recent appointment
echo "2. Testing with recent appointment...\n";
$recentAppointment = \App\Models\Appointment::orderBy('created_at', 'desc')->first();

if ($recentAppointment) {
    echo "Found appointment:\n";
    echo "- ID: {$recentAppointment->id}\n";
    echo "- Status: {$recentAppointment->status}\n";
    echo "- Email: {$recentAppointment->email}\n";
    echo "- Dentist: {$recentAppointment->preferred_dentist}\n";
    echo "- Created: {$recentAppointment->created_at}\n\n";

    // 3. Test email sending with detailed logging
    echo "3. Testing email sending with detailed logging...\n";
    
    try {
        // Test patient email
        echo "Sending patient notification...\n";
        $dentist = \App\Models\User::where('email', $recentAppointment->preferred_dentist)->first();
        $dentistName = $dentist ? $dentist->name : 'Dentala Clinic Specialist';
        
        Mail::to($recentAppointment->email)->send(new PatientNotificationMail(
            $recentAppointment, 
            'pending', 
            '', 
            $dentistName
        ));
        
        echo "✅ Patient email sent successfully\n";
        
        // Test admin email
        echo "Sending admin notification...\n";
        Mail::to($recentAppointment->preferred_dentist)->send(new AdminNotificationMail(
            $recentAppointment, 
            'New Booking'
        ));
        
        echo "✅ Admin email sent successfully\n";
        
    } catch (Exception $e) {
        echo "❌ Email sending failed: " . $e->getMessage() . "\n";
        echo "Error trace: " . $e->getTraceAsString() . "\n";
    }
} else {
    echo "No appointments found in database\n";
}

echo "\n";

// 4. Check mail configuration
echo "4. Checking mail configuration...\n";
echo "MAIL_MAILER: " . config('mail.default') . "\n";
echo "MAIL_HOST: " . config('mail.mailers.smtp.host') . "\n";
echo "MAIL_PORT: " . config('mail.mailers.smtp.port') . "\n";
echo "MAIL_USERNAME: " . config('mail.mailers.smtp.username') . "\n";
echo "MAIL_FROM_ADDRESS: " . config('mail.from.address') . "\n";
echo "QUEUE_CONNECTION: " . config('queue.default') . "\n";

echo "\n=== Debug Complete ===\n";
