-- Complete fix for dentist display issue

-- 1. Ensure admin user has proper name
UPDATE "users" 
SET "name" = 'Dr. Hin D. Sadboi' 
WHERE "id" = 2 AND "role" = 'admin';

-- 2. Add the missing patient account (poculas.nna@gmail.com)
INSERT INTO "users" ("id", "email", "name", "phone", "profile_photo_path", "email_verified_at", "password", "role", "remember_token", "created_at", "updated_at") 
SELECT 4, 'poculas.nna@gmail.com', 'Patient User', '09123456789', NULL, NULL, '$2y$12$uU8/2Im6twjy3LpiRVU/NO5Qhs4q./hm5DGeK7n2zhfL4ZmDx6jlO', 'patient', NULL, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "users" WHERE email = 'poculas.nna@gmail.com');

-- 3. Verify all users
SELECT "id", "email", "name", "role" FROM "users" ORDER BY "id";

-- 4. Test the dentist query that the app uses
SELECT "id", "name", "email" FROM "users" WHERE "role" = 'admin';

-- 5. Update sequence if needed
SELECT setval('users_id_seq', (SELECT MAX(id) FROM "users"));
