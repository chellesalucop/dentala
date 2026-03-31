-- Debug script to check users and dentist data

-- Check all users in database
SELECT "id", "email", "name", "role", "created_at" FROM "users" ORDER BY "role", "id";

-- Check if the admin user exists and has proper name
SELECT "id", "email", "name", "role" FROM "users" WHERE "role" = 'admin';

-- Test the getDentists query directly
SELECT "id", "name", "email" FROM "users" WHERE "role" = 'admin';

-- Check if poculas.nna@gmail.com exists
SELECT "id", "email", "name", "role" FROM "users" WHERE "email" = 'poculas.nna@gmail.com';
