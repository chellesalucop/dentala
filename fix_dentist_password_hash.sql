-- Fix dentist password hashing issue
-- Laravel doesn't auto-hash passwords updated via SQL
-- Need to manually hash the password using Laravel's bcrypt

-- First, check current password (should be plain text):
SELECT id, email, password FROM "users" WHERE role = 'admin';

-- Option 1: Use Laravel's bcrypt hash (recommended)
-- Generate hash using Laravel or online bcrypt generator
-- Example hash for 'new-password': $2y$10$abcdefghijklmnopqrstuvwxyz1234567890

-- Replace with your actual hashed password:
UPDATE "users" 
SET password = '$2y$10$abcdefghijklmnopqrstuvwxyz1234567890'
WHERE email = 'your-dentist-email@example.com';

-- Option 2: Use Laravel command (if you have access to artisan)
-- php artisan tinker
-- $user = App\Models\User::where('email', 'your-email@example.com')->first();
-- $user->password = bcrypt('your-plain-password');
-- $user->save();

-- Verify the update (should show hashed password):
SELECT id, email, password FROM "users" WHERE role = 'admin';
