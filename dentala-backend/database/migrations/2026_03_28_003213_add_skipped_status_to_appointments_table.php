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
        // 🛡️ NO-SHOW LOGIC: Update status column comment to include 'skipped'
        Schema::table('appointments', function (Blueprint $table) {
            // Update the column comment to reflect all valid statuses
            $table->string('status')->comment('Appointment status: pending, confirmed, completed, cancelled, skipped')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // Revert to original comment
            $table->string('status')->comment('Appointment status: pending, confirmed, completed, cancelled')->change();
        });
    }
};
