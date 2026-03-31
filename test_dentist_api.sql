-- Test the exact query that the getDentists() function uses
-- This simulates what the API endpoint should return

SELECT "id", "name", "email" FROM "users" WHERE "role" = 'admin';

-- Also check if there are any other admin/dentist roles
SELECT "id", "email", "name", "role" FROM "users" WHERE "role" IN ('admin', 'dentist');

-- Check the exact data structure expected by the frontend
SELECT json_build_object(
  'dentists', json_agg(
    json_build_object(
      'id', "id",
      'name', "name",
      'email', "email"
    )
  )
) as dentist_json
FROM "users" 
WHERE "role" = 'admin';
