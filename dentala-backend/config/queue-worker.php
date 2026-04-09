<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Queue Worker Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains configuration for the queue worker that processes
    | background jobs including email notifications. This helps prevent
    | slow response times for user interactions.
    |
    */

    'worker' => [
        'sleep' => 3,
        'tries' => 3,
        'timeout' => 60,
        'max_time' => 0,
        'rest' => 0,
        'memory_limit' => 128,
    ],

    /*
    |--------------------------------------------------------------------------
    | Failed Job Configuration
    |--------------------------------------------------------------------------
    |
    | Configure how failed jobs are handled and retried.
    |
    */
    'failed' => [
        'max_tries' => 3,
        'retry_after' => 90,
    ],
];
