<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // THIS IS THE FIX: It tells Laravel to allow Sanctum to check tokens on API routes
        $middleware->statefulApi(); 
        
        // Also ensure SPA/API cross-origin requests are handled
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Ensure ValidationException returns JSON for API routes with proper error messages
        $exceptions->render(function (\Throwable $e, Request $request) {
            if ($e instanceof \Illuminate\Validation\ValidationException && $request->is('api/*')) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => $e->errors()
                ], 422);
            }
        });
    })->create();