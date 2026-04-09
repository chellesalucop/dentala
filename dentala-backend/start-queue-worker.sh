#!/bin/bash

# Queue Worker Startup Script for Dentala
# This script starts the Laravel queue worker to process background emails
# Place this in your production deployment to ensure emails are processed

echo "Starting Dentala Queue Worker..."

# Set the queue worker to run continuously
# --sleep=3: Wait 3 seconds between jobs
# --tries=3: Retry failed jobs up to 3 times
# --timeout=60: Kill jobs that run longer than 60 seconds
php artisan queue:work --sleep=3 --tries=3 --timeout=60 --memory=128

echo "Queue worker stopped."
