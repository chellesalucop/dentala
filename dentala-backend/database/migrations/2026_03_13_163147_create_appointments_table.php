<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            // Link to the user who booked it (nullable in case you allow guest bookings later)
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            
            // Personal Info
            $table->string('full_name');
            $table->string('phone');
            $table->string('email');
            
            // Appointment Info
            $table->string('service_type');
            $table->string('preferred_dentist');
            
            // Medical Conditions (Stored as JSON array since they can select multiple)
            $table->json('medical_conditions')->nullable();
            $table->string('others')->nullable();
            
            // Schedule Info
            $table->date('appointment_date');
            $table->string('preferred_time');
            
            // Tracking status (upcoming, completed, cancelled)
            $table->string('status')->default('upcoming');
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};