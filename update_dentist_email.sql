-- Update dentist/admin email and password
-- Replace with your desired new email and password

-- First, check current email:
SELECT id, email, role, name FROM "users" WHERE role = 'admin';

-- Update email and password (replace with your new email and password):
UPDATE "users" 
SET email = 'new-dentist-email@example.com',
    password = 'your-new-password'
WHERE email = 'mercedeskyla419@gmail.com';

-- Verify the update:
SELECT id, email, role, name FROM "users" WHERE role = 'admin';

-- Note: This will change:
-- 1. Email that patients see when booking appointments
-- 2. Password that dentist uses to log in
-- 3. All future appointment assignments
