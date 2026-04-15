<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

Route::get('/api/health', function () {
    $startTime = microtime(true);
    
    try {
        // Test database connection
        \Illuminate\Support\Facades\DB::select('SELECT 1');
        $dbStatus = 'ok';
        $dbTime = (microtime(true) - $startTime) * 1000;
    } catch (\Exception $e) {
        $dbStatus = 'error: ' . $e->getMessage();
        $dbTime = null;
    }
    
    // Test queue
    try {
        $jobsCount = \Illuminate\Support\Facades\DB::table('jobs')->count();
        $queueStatus = 'ok';
    } catch (\Exception $e) {
        $queueStatus = 'error: ' . $e->getMessage();
        $jobsCount = null;
    }
    
    $totalTime = (microtime(true) - $startTime) * 1000;
    
    return response()->json([
        'status' => 'healthy',
        'timestamp' => now()->toISOString(),
        'response_time_ms' => round($totalTime, 2),
        'database' => [
            'status' => $dbStatus,
            'test_time_ms' => $dbTime ? round($dbTime, 2) : null
        ],
        'queue' => [
            'status' => $queueStatus,
            'jobs_count' => $jobsCount
        ]
    ]);
});
