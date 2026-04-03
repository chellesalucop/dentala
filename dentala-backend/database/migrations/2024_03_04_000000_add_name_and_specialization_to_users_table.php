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
        Schema::table('users', function (Blueprint $table) {
            // Check if name column exists, if not rename username to name
            if (!Schema::hasColumn('users', 'name') && Schema::hasColumn('users', 'username')) {
                $table->renameColumn('username', 'name');
            } elseif (!Schema::hasColumn('users', 'name')) {
                $table->string('name')->nullable();
            }
            
            // Add specialization if it doesn't exist
            if (!Schema::hasColumn('users', 'specialization')) {
                $table->string('specialization')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['specialization']);
        });
    }
};
