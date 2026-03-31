<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if the admin already exists so we don't create duplicates
        $adminEmail = 'admin@dentala.com';

        if (!User::where('email', $adminEmail)->exists()) {
            User::create([
                'email' => $adminEmail,
                'phone' => '09155555555',
                'password' => Hash::make('password123'), // Securely hashes the password
                'role' => 'admin',
            ]);
            
            $this->command->info('Admin user created successfully!');
        } else {
            $this->command->info('Admin user already exists.');
        }
    }
}