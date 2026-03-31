-- Fix patient name for poculas.nna@gmail.com
UPDATE "users" 
SET "name" = 'Patient User' 
WHERE "email" = 'poculas.nna@gmail.com';

-- Verify the update
SELECT "id", "email", "name", "role" FROM "users" WHERE "email" = 'poculas.nna@gmail.com';

-- Also verify the dentist is properly set up
SELECT "id", "name", "email" FROM "users" WHERE "role" = 'admin';
