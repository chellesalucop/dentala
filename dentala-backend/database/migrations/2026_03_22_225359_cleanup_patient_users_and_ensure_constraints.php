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
        // 1. Delete all patient accounts while preserving admin accounts
        \DB::table('users')->where('role', 'patient')->delete();
        
        // 2. Ensure email column has unique constraint (prevents race conditions)
        Schema::table('users', function (Blueprint $table) {
            // Only add unique if it doesn't exist
            if (!Schema::hasIndex('users', 'users_email_unique')) {
                $table->unique('email', 'users_email_unique');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration is not reversible as it deletes data
        // To restore, you would need to restore from backup
    }
};
