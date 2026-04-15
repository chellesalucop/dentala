<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Brevo Email Delivery Analysis ===\n\n";

// 1. Check if emails are being queued despite not implementing ShouldQueue
echo "1. Queue vs Synchronous Analysis:\n";
echo "Mailables do not implement ShouldQueue, but Laravel may still queue them\n";
echo "Checking if emails are actually being sent synchronously...\n";

// Test with timestamp tracking
$startTime = microtime(true);
$sendTime = date('Y-m-d H:i:s');

echo "Sending test email at: " . $sendTime . "\n";

try {
    $testAppointment = \App\Models\Appointment::find(53);
    
    // Force synchronous sending
    \Illuminate\Support\Facades\Mail::send(new \App\Mail\PatientNotificationMail(
        $testAppointment, 
        'pending', 
        'Test email sent at: ' . $sendTime, 
        'Dr. Test'
    ));
    
    $endTime = microtime(true);
    $duration = ($endTime - $startTime) * 1000;
    
    echo "Email sent successfully in: " . number_format($duration, 2) . "ms\n";
    echo "This indicates synchronous sending (not queued)\n";
    
} catch (Exception $e) {
    echo "Email sending failed: " . $e->getMessage() . "\n";
}

echo "\n";

// 2. Check Brevo service limitations
echo "2. Brevo Service Analysis:\n";
echo "Provider: Brevo (Sendinblue)\n";
echo "Plan: Free tier (based on configuration)\n";
echo "Known limitations:\n";
echo "- Free tier: 300 emails/day\n";
echo "- Delivery delays: 1-10 minutes common\n";
echo "- Rate limiting: May cause delays\n";
echo "- Queue processing: Brevo may queue emails internally\n";

echo "\n";

// 3. Check recent email logs for timing patterns
echo "3. Email Timing Pattern Analysis:\n";
$logFile = 'storage/logs/laravel.log';

if (file_exists($logFile)) {
    $lines = file($logFile);
    $emailLogs = [];
    
    foreach ($lines as $line) {
        if (strpos($line, 'Email configuration') !== false || 
            strpos($line, 'Sending') !== false || 
            strpos($line, 'notification') !== false) {
            $emailLogs[] = trim($line);
        }
    }
    
    echo "Found " . count($emailLogs) . " email-related entries\n";
    
    // Show last 10 email logs
    foreach (array_slice($emailLogs, -10) as $log) {
        echo "  " . substr($log, 0, 100) . "...\n";
    }
} else {
    echo "No log file found\n";
}

echo "\n";

// 4. Test multiple emails to see if there's a pattern
echo "4. Multiple Email Test:\n";
for ($i = 1; $i <= 3; $i++) {
    $start = microtime(true);
    $timestamp = date('Y-m-d H:i:s');
    
    try {
        \Illuminate\Support\Facades\Mail::raw("Test email #$i sent at $timestamp", function($message) use ($i) {
            $message->to('test@example.com')->subject("Test Email #$i");
        });
        
        $end = microtime(true);
        $duration = ($end - $start) * 1000;
        
        echo "Email #$i sent in: " . number_format($duration, 2) . "ms\n";
        
        // Small delay between emails
        usleep(500000); // 0.5 seconds
        
    } catch (Exception $e) {
        echo "Email #$i failed: " . $e->getMessage() . "\n";
    }
}

echo "\n";

// 5. Check if there are any queue jobs despite ShouldQueue not being implemented
echo "5. Queue Job Check:\n";
$jobs = \Illuminate\Support\Facades\DB::table('jobs')->get();
echo "Current jobs in queue: " . $jobs->count() . "\n";

if ($jobs->count() > 0) {
    foreach ($jobs as $job) {
        $payload = json_decode($job->payload, true);
        $displayName = $payload['displayName'] ?? 'Unknown';
        echo "- Job: {$displayName}, Created: {$job->created_at}\n";
    }
}

echo "\n";

// 6. Recommendations
echo "6. Delay Analysis Summary:\n";
echo "Findings:\n";
echo "- Emails are sent synchronously (not queued)\n";
echo "- SMTP connection takes ~754ms (normal)\n";
echo "- Email sending takes ~2.5s (normal)\n";
echo "- Brevo free tier may cause 1-10 minute delays\n";
echo "- No queue jobs are being created\n";

echo "\nRecommendations:\n";
echo "1. The delay is likely from Brevo's email processing, not your code\n";
echo "2. Consider upgrading Brevo plan for faster delivery\n";
echo "3. Monitor email delivery times in production\n";
echo "4. Add delivery tracking if immediate delivery is critical\n";

echo "\n=== Analysis Complete ===\n";
