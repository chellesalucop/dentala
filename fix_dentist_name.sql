-- Fix dentist name for proper display
-- Update admin user to have a proper name instead of NULL

UPDATE "users" 
SET "name" = 'Dr. Hin D. Sadboi' 
WHERE "id" = 2 AND "role" = 'admin';

-- Verify the update
SELECT "id", "email", "name", "role" FROM "users" WHERE "role" = 'admin';
