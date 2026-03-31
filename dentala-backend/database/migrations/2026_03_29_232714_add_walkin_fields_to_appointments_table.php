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
        Schema::table('appointments', function (Blueprint $table) {
            // Add booked_by_admin flag to track walk-in appointments
            if (!Schema::hasColumn('appointments', 'booked_by_admin')) {
                $table->boolean('booked_by_admin')->default(false)->after('status');
            }
            
            // Add cancellation_reason column for audit trail
            if (!Schema::hasColumn('appointments', 'cancellation_reason')) {
                $table->text('cancellation_reason')->nullable()->after('booked_by_admin');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn(['booked_by_admin', 'cancellation_reason']);
        });
    }
};
