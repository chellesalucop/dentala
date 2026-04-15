<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Email Delivery Delay Investigation ===\n\n";

// 1. Check if emails are being sent synchronously or queued
echo "1. Email Sending Method Analysis:\n";
echo "QUEUE_CONNECTION: " . config('queue.default') . "\n";

// Check if mailables implement ShouldQueue
$patientMail = new \App\Mail\PatientNotificationMail(new stdClass(), 'pending');
$adminMail = new \App\Mail\AdminNotificationMail(new stdClass(), 'New Booking');

echo "PatientNotificationMail implements ShouldQueue: " . (in_array('Illuminate\Contracts\Queue\ShouldQueue', class_implements($patientMail)) ? 'Yes' : 'No') . "\n";
echo "AdminNotificationMail implements ShouldQueue: " . (in_array('Illuminate\Contracts\Queue\ShouldQueue', class_implements($adminMail)) ? 'Yes' : 'No') . "\n";

echo "\n";

// 2. Check recent Laravel logs for email timing
echo "2. Recent Email Log Analysis:\n";
$logFile = 'storage/logs/laravel.log';

if (file_exists($logFile)) {
    $lines = file($logFile);
    $emailLines = [];
    
    foreach ($lines as $line) {
        if (strpos($line, 'Email') !== false || strpos($line, 'Mail') !== false) {
            $emailLines[] = trim($line);
        }
    }
    
    if (count($emailLines) > 0) {
        echo "Found " . count($emailLines) . " email-related log entries:\n";
        foreach (array_slice($emailLines, -10) as $log) {
            echo "  " . $log . "\n";
        }
    } else {
        echo "No email-related logs found\n";
    }
} else {
    echo "Log file not found\n";
}

echo "\n";

// 3. Test email sending speed
echo "3. Email Sending Speed Test:\n";
$startTime = microtime(true);

try {
    $testAppointment = \App\Models\Appointment::find(53);
    if ($testAppointment) {
        echo "Testing email sending speed...\n";
        
        $sendTime = microtime(true);
        \Illuminate\Support\Facades\Mail::to($testAppointment->email)
            ->send(new \App\Mail\PatientNotificationMail($testAppointment, 'pending', '', 'Test Dentist'));
        $endTime = microtime(true);
        
        $sendDuration = ($endTime - $sendTime) * 1000; // Convert to milliseconds
        $totalDuration = ($endTime - $startTime) * 1000;
        
        echo "Email send time: " . number_format($sendDuration, 2) . "ms\n";
        echo "Total test time: " . number_format($totalDuration, 2) . "ms\n";
        
        if ($sendDuration > 5000) {
            echo "WARNING: Email sending is slow (>5s)\n";
        } else {
            echo "Email sending speed is normal\n";
        }
    }
} catch (Exception $e) {
    echo "Email speed test failed: " . $e->getMessage() . "\n";
}

echo "\n";

// 4. Check mail server connection
echo "4. Mail Server Connection Test:\n";
try {
    $config = [
        'host' => config('mail.mailers.smtp.host'),
        'port' => config('mail.mailers.smtp.port'),
        'username' => config('mail.mailers.smtp.username'),
        'encryption' => config('mail.mailers.smtp.encryption'),
    ];
    
    echo "SMTP Host: " . $config['host'] . "\n";
    echo "SMTP Port: " . $config['port'] . "\n";
    echo "SMTP Encryption: " . $config['encryption'] . "\n";
    
    // Test connection with a simple email
    $connectionStart = microtime(true);
    \Illuminate\Support\Facades\Mail::raw('Connection test email', function($message) {
        $message->to('test@example.com')->subject('Connection Test');
    });
    $connectionEnd = microtime(true);
    
    $connectionTime = ($connectionEnd - $connectionStart) * 1000;
    echo "Connection test time: " . number_format($connectionTime, 2) . "ms\n";
    
    if ($connectionTime > 10000) {
        echo "WARNING: Mail server connection is slow (>10s)\n";
    }
    
} catch (Exception $e) {
    echo "Connection test failed: " . $e->getMessage() . "\n";
}

echo "\n";

// 5. Check if queue worker is running in production
echo "5. Queue Worker Status:\n";
echo "Checking if queue worker process is running...\n";

// On Render, the queue worker is a separate service
// We can check if there are any jobs being processed
$recentJobs = \Illuminate\Support\Facades\DB::table('jobs')
    ->orderBy('created_at', 'desc')
    ->limit(5)
    ->get();

echo "Recent jobs in queue: " . $recentJobs->count() . "\n";

foreach ($recentJobs as $job) {
    echo "- Job ID: {$job->id}, Created: {$job->created_at}, Attempts: {$job->attempts}\n";
}

echo "\n";

// 6. Check email service provider (Brevo) performance
echo "6. Email Service Provider Analysis:\n";
echo "Using: Brevo (smtp-relay.brevo.com)\n";
echo "Free tier limitations may cause delays\n";
echo "Typical delivery times for Brevo free tier: 1-10 minutes\n";

echo "\n=== Investigation Complete ===\n";
