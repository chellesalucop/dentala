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
        // 🛡️ GHOST RECORD: Add soft deletes for audit integrity and recovery
        Schema::table('appointments', function (Blueprint $table) {
            $table->softDeletes(); // Adds the 'deleted_at' column
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 🛡️ REVERSE: Remove soft deletes column
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
