<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Recent Email Activity Analysis ===\n\n";

// 1. Check recent appointments from logs
echo "1. Recent Appointments Analysis:\n";
$recentAppointments = \App\Models\Appointment::orderBy('created_at', 'desc')->limit(5)->get();

foreach ($recentAppointments as $apt) {
    echo "- ID: {$apt->id}, Status: {$apt->status}, Email: {$apt->email}, Created: {$apt->created_at}\n";
}

echo "\n";

// 2. Check Laravel logs for recent email activity
echo "2. Recent Laravel Log Analysis:\n";
$logFile = 'storage/logs/laravel.log';

if (file_exists($logFile)) {
    // Get last 50 lines of log
    $lines = file($logFile);
    $recentLines = array_slice($lines, -50);
    
    $emailLogs = [];
    foreach ($recentLines as $line) {
        if (strpos($line, 'Email') !== false || strpos($line, 'Mail') !== false || strpos($line, 'Queue') !== false) {
            $emailLogs[] = trim($line);
        }
    }
    
    if (count($emailLogs) > 0) {
        echo "Found " . count($emailLogs) . " email-related log entries:\n";
        foreach (array_slice($emailLogs, -10) as $log) {
            echo "  " . $log . "\n";
        }
    } else {
        echo "No recent email-related logs found\n";
    }
} else {
    echo "Log file not found\n";
}

echo "\n";

// 3. Check if emails are being sent synchronously vs queued
echo "3. Email Sending Method Analysis:\n";
echo "QUEUE_CONNECTION: " . config('queue.default') . "\n";

// Check if mailables implement ShouldQueue
$patientMail = new \App\Mail\PatientNotificationMail(new stdClass(), 'pending');
$adminMail = new \App\Mail\AdminNotificationMail(new stdClass(), 'New Booking');

echo "PatientNotificationMail implements ShouldQueue: " . (in_array('Illuminate\Contracts\Queue\ShouldQueue', class_implements($patientMail)) ? 'Yes' : 'No') . "\n";
echo "AdminNotificationMail implements ShouldQueue: " . (in_array('Illuminate\Contracts\Queue\ShouldQueue', class_implements($adminMail)) ? 'Yes' : 'No') . "\n";

echo "\n";

// 4. Test immediate email sending (synchronous)
echo "4. Testing Synchronous Email Sending:\n";
try {
    $testAppointment = \App\Models\Appointment::find(53);
    if ($testAppointment) {
        echo "Testing immediate email send (not queued)...\n";
        
        // Force synchronous sending
        \Illuminate\Support\Facades\Mail::send(new \App\Mail\PatientNotificationMail(
            $testAppointment, 
            'pending', 
            '', 
            'Test Dentist'
        ));
        
        echo "Synchronous email sent successfully\n";
    }
} catch (Exception $e) {
    echo "Synchronous email failed: " . $e->getMessage() . "\n";
}

echo "\n=== Analysis Complete ===\n";
