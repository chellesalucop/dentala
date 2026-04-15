<?php

/**
 * Performance diagnostic script to identify bottlenecks
 * Run this script to check database, queue, and API performance
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Dentala Performance Diagnostic ===\n\n";

// Test 1: Database Connection
echo "1. Testing Database Connection:\n";
try {
    $startTime = microtime(true);
    \Illuminate\Support\Facades\DB::select('SELECT 1');
    $dbTime = (microtime(true) - $startTime) * 1000;
    echo "   - Database connection: " . number_format($dbTime, 2) . " ms\n";
    
    if ($dbTime > 100) {
        echo "   - WARNING: Database connection is slow (>100ms)\n";
    }
} catch (\Exception $e) {
    echo "   - ERROR: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 2: Queue Status
echo "2. Checking Queue Status:\n";
try {
    $jobsCount = \Illuminate\Support\Facades\DB::table('jobs')->count();
    $failedJobs = \Illuminate\Support\Facades\DB::table('failed_jobs')->count();
    
    echo "   - Jobs in queue: " . $jobsCount . "\n";
    echo "   - Failed jobs: " . $failedJobs . "\n";
    
    if ($jobsCount > 50) {
        echo "   - WARNING: Queue backlog detected\n";
    }
    
    if ($failedJobs > 10) {
        echo "   - WARNING: Many failed jobs\n";
    }
} catch (\Exception $e) {
    echo "   - ERROR: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 3: Appointment Query Performance
echo "3. Testing Appointment Query Performance:\n";
try {
    $startTime = microtime(true);
    
    // Simulate the query from appointments/index
    $appointments = \App\Models\Appointment::limit(10)->get();
    
    $queryTime = (microtime(true) - $startTime) * 1000;
    echo "   - Simple appointment query: " . number_format($queryTime, 2) . " ms\n";
    
    if ($queryTime > 500) {
        echo "   - WARNING: Query is slow (>500ms)\n";
    }
    
} catch (\Exception $e) {
    echo "   - ERROR: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 4: Email Queue Test
echo "4. Testing Email Queue:\n";
try {
    $startTime = microtime(true);
    
    // Test queueing an email without actually sending
    $testAppointment = new \stdClass();
    $testAppointment->id = 9999;
    $testAppointment->full_name = 'Test';
    $testAppointment->email = 'test@example.com';
    $testAppointment->preferred_dentist = 'dentist@example.com';
    $testAppointment->service_type = 'Test';
    $testAppointment->appointment_date = '2026-04-15';
    $testAppointment->preferred_time = '10:00 AM';
    $testAppointment->status = 'pending';
    
    // Just test the queuing part
    \Illuminate\Support\Facades\Queue::push(function() {
        // Dummy job
    });
    
    $queueTime = (microtime(true) - $startTime) * 1000;
    echo "   - Queue push operation: " . number_format($queueTime, 2) . " ms\n";
    
    if ($queueTime > 50) {
        echo "   - WARNING: Queue operation is slow (>50ms)\n";
    }
    
} catch (\Exception $e) {
    echo "   - ERROR: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 5: Configuration Check
echo "5. Configuration Check:\n";
echo "   - Queue Driver: " . config('queue.default') . "\n";
echo "   - Cache Driver: " . config('cache.default') . "\n";
echo "   - Session Driver: " . config('session.driver') . "\n";
echo "   - Database Connection: " . config('database.default') . "\n";

echo "\n=== Diagnostic Complete ===\n";
