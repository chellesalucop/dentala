<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Queue Status Check ===\n\n";

// 1. Check queue configuration
echo "1. Queue Configuration:\n";
echo "QUEUE_CONNECTION: " . config('queue.default') . "\n";
echo "Queue Driver: " . config('queue.connections.database.driver') . "\n\n";

// 2. Check if queue table exists and has jobs
echo "2. Queue Jobs Table:\n";
try {
    $jobsCount = DB::table('jobs')->count();
    echo "Pending jobs: " . $jobsCount . "\n";
    
    if ($jobsCount > 0) {
        echo "\nRecent jobs:\n";
        $recentJobs = DB::table('jobs')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get(['id', 'queue', 'attempts', 'created_at', 'payload']);
            
        foreach ($recentJobs as $job) {
            $payload = json_decode($job->payload, true);
            $displayName = $payload['displayName'] ?? 'Unknown';
            echo "- Job ID: {$job->id}, Queue: {$job->queue}, Attempts: {$job->attempts}, Class: {$displayName}, Created: {$job->created_at}\n";
        }
    }
} catch (Exception $e) {
    echo "Error checking jobs table: " . $e->getMessage() . "\n";
}

echo "\n";

// 3. Check failed jobs
echo "3. Failed Jobs Table:\n";
try {
    $failedJobsCount = DB::table('failed_jobs')->count();
    echo "Failed jobs: " . $failedJobsCount . "\n";
    
    if ($failedJobsCount > 0) {
        echo "\nRecent failed jobs:\n";
        $recentFailed = DB::table('failed_jobs')
            ->orderBy('failed_at', 'desc')
            ->limit(3)
            ->get(['id', 'queue', 'exception', 'failed_at']);
            
        foreach ($recentFailed as $job) {
            echo "- Job ID: {$job->id}, Queue: {$job->queue}, Failed: {$job->failed_at}\n";
            echo "  Exception: " . substr($job->exception, 0, 200) . "...\n\n";
        }
    }
} catch (Exception $e) {
    echo "Error checking failed jobs table: " . $e->getMessage() . "\n";
}

echo "\n";

// 4. Test queue worker status
echo "4. Queue Worker Test:\n";
echo "Checking if queue worker is running...\n";

// Create a test job
try {
    $jobId = DB::table('jobs')->insertGetId([
        'queue' => 'default',
        'payload' => json_encode([
            'displayName' => 'App\\Jobs\\TestJob',
            'job' => 'Illuminate\\Queue\\CallQueuedHandler@call',
            'data' => [
                'test' => true,
                'timestamp' => now()->toISOString()
            ]
        ]),
        'attempts' => 0,
        'created_at' => now(),
        'available_at' => now()
    ]);
    
    echo "✅ Test job created with ID: {$jobId}\n";
    
    // Check if job gets processed (wait a moment)
    sleep(3);
    
    $jobStillExists = DB::table('jobs')->where('id', $jobId)->exists();
    if ($jobStillExists) {
        echo "❌ Job still in queue - queue worker may not be running\n";
    } else {
        echo "✅ Job processed successfully\n";
    }
    
} catch (Exception $e) {
    echo "Error creating test job: " . $e->getMessage() . "\n";
}

echo "\n=== Queue Check Complete ===\n";
