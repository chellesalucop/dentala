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
            $table->string('hmo_provider')->nullable()->after('specialization');
            $table->string('hmo_card_path')->nullable()->after('hmo_provider');
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->string('hmo_provider')->nullable()->after('booked_by_admin');
            $table->string('hmo_card_path')->nullable()->after('hmo_provider');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['hmo_provider', 'hmo_card_path']);
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn(['hmo_provider', 'hmo_card_path']);
        });
    }
};
