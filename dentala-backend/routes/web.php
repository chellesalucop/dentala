<?php

use Illuminate\Support\Facades\Route;

// API routes are handled separately in routes/api.php

// Serve React frontend for all non-API routes
Route::get('/{any}', function () {
    return File::get(public_path('index.html'));
})->where('any', '^(?!api).*');
