-- PostgreSQL Data Migration for Dentala App
-- Import this into your Render PostgreSQL database via pgAdmin4

-- Reset sequences to start from 1
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE appointments_id_seq RESTART WITH 1;
ALTER SEQUENCE personal_access_tokens_id_seq RESTART WITH 1;

-- Insert Users Data
INSERT INTO "users" ("id", "email", "name", "phone", "profile_photo_path", "email_verified_at", "password", "role", "remember_token", "created_at", "updated_at") VALUES
(2, 'mercedeskyla419@gmail.com', 'Hin D. Sadboi', '09333333333', NULL, NULL, '$2y$12$.5KgdWu1zjzhBemUeeHIJusJ9YIklWkJuFu6rWZUP2VDoDyeZnd0S', 'admin', NULL, '2026-03-30 16:35:54', '2026-03-30 16:35:54'),
(3, 'dariguezedrian@gmail.com', NULL, '09887653678', NULL, NULL, '$2y$12$uU8/2Im6twjy3LpiRVU/NO5Qhs4q./hm5DGeK7n2zhfL4ZmDx6jlO', 'patient', NULL, '2026-03-30 16:48:23', '2026-03-30 16:48:23');

-- Insert Appointments Data
INSERT INTO "appointments" ("id", "user_id", "full_name", "phone", "email", "service_type", "custom_service", "preferred_dentist", "medical_conditions", "others", "appointment_date", "preferred_time", "status", "booked_by_admin", "cancellation_reason", "created_at", "updated_at", "deleted_at") VALUES
(1, 3, 'Kung Ako Na Kasi', '09887653621', 'dariguezedrian@gmail.com', 'Tooth Extraction', NULL, 'mercedeskyla419@gmail.com', '["Cosmetic Improvement"]', NULL, '2026-03-31', '11:00 AM', 'expired', 0, 'Automatically expired: Appointment time has passed without clinic action.', '2026-03-30 16:49:37', '2026-03-30 16:49:44', NULL),
(2, 3, 'Kung Ako Na Kasi', '09887653621', 'dariguezedrian@gmail.com', 'Dental Cleaning', NULL, 'mercedeskyla419@gmail.com', '["Bleeding Gums","Bad Breath","Loose Tooth","Broken/Chipped Tooth","Wisdom Tooth Pain"]', NULL, '2026-04-02', '01:00 PM', 'cancelled', 0, 'ghdfghdfg', '2026-03-30 16:50:49', '2026-03-30 16:52:03', NULL),
(3, 3, 'Edrian Paul Dariguez', '09887653621', 'dariguezedrian@gmail.com', 'Dental Cleaning', NULL, 'mercedeskyla419@gmail.com', '["Bleeding Gums"]', NULL, '2026-03-31', '11:00 AM', 'expired', 0, 'Automatically expired: Appointment time has passed without clinic action.', '2026-03-30 16:57:59', '2026-03-30 16:58:33', NULL),
(4, 3, 'Edrian Paul Dariguez', '09887653621', 'dariguezedrian@gmail.com', 'Tooth Filling', NULL, 'mercedeskyla419@gmail.com', '[]', NULL, '2026-04-01', '11:00 AM', 'declined', 0, 'HAHAHHHA', '2026-03-30 17:02:40', '2026-03-30 17:04:18', NULL),
(5, 3, 'Edrian Paul Dariguez', '09887653678', 'dariguezedrian@gmail.com', 'Tooth Filling', NULL, 'mercedeskyla419@gmail.com', '["Bleeding Gums","Loose Tooth"]', NULL, '2026-04-09', '01:00 PM', 'completed', 0, NULL, '2026-03-30 17:03:12', '2026-03-30 17:07:59', NULL),
(6, 3, 'Edrian Paul Dariguez', '09887653621', 'dariguezedrian@gmail.com', 'Tooth Extraction', NULL, 'mercedeskyla419@gmail.com', '[]', NULL, '2026-04-02', '09:00 AM', 'declined', 0, 'adsfasdfasd', '2026-03-30 17:22:04', '2026-03-30 17:45:16', NULL),
(7, 3, 'Edrian Paul Dariguez', '09887653621', 'dariguezedrian@gmail.com', 'Teeth Whitening', NULL, 'mercedeskyla419@gmail.com', '["Bleeding Gums"]', NULL, '2026-04-01', '01:00 PM', 'no-show', 0, 'AJAJAJAJAJAJAJ', '2026-03-30 17:45:54', '2026-03-30 17:46:48', NULL),
(8, 3, 'Edrian Paul Dariguez', '09333333333', 'dariguezedrian@gmail.com', 'Tooth Extraction', NULL, 'mercedeskyla419@gmail.com', '["Cosmetic Improvement"]', NULL, '2026-04-02', '09:00 AM', 'cancelled', 0, 'FGFGSD', '2026-03-30 17:47:25', '2026-03-30 17:47:51', NULL),
(9, NULL, 'Kaka Cell P. honeMoyan', '09222323232', 'dariguezedrian@gmail.com', 'Dental Cleaning', NULL, 'mercedeskyla419@gmail.com', '["Bad Breath","Cosmetic Improvement"]', NULL, '2026-04-01', '07:00 AM', 'completed', 1, NULL, '2026-03-30 17:48:32', '2026-03-30 18:03:08', NULL),
(10, NULL, 'Venus Mars Saturn', '09976876786', 'dariguezedrian@gmail.com', 'Regular Checkup', NULL, 'mercedeskyla419@gmail.com', '["Bleeding Gums","Bad Breath"]', NULL, '2026-04-22', '07:00 AM', 'no-show', 1, 'fgdsdfg', '2026-03-30 18:03:42', '2026-03-30 18:08:06', NULL),
(11, NULL, 'Venus Mars Saturn', '09777777777', 'dariguezedrian@gmail.com', 'Tooth Filling', NULL, 'mercedeskyla419@gmail.com', '["Bad Breath","Cosmetic Improvement"]', NULL, '2026-04-28', '07:00 AM', 'completed', 1, NULL, '2026-03-30 18:07:15', '2026-03-30 18:07:59', NULL);

-- Insert Personal Access Tokens (for existing sessions)
INSERT INTO "personal_access_tokens" ("id", "tokenable_type", "tokenable_id", "name", "token", "abilities", "last_used_at", "expires_at", "created_at", "updated_at") VALUES
(1, 'App\Models\User', 2, 'auth_token', 'ec3255f889a4d498057acf2e02a4dee40a64df4b4bbf6cb5af02d9c6a056dd2f', '["*"]', NULL, NULL, '2026-03-30 16:35:54', '2026-03-30 16:35:54'),
(3, 'App\Models\User', 2, 'auth_token', 'a5c79f1f7d7a674007d1f2d82736831f1788f92c9cd60a1446c4a042aa125168', '["*"]', '2026-03-30 19:46:37', NULL, '2026-03-30 16:39:38', '2026-03-30 19:46:37'),
(4, 'App\Models\User', 3, 'auth_token', 'bcb1afd24ba84fb3a716a0269c33e85eb96a3a3a734e390ca06a8fbde189355b', '["*"]', NULL, NULL, '2026-03-30 16:48:23', '2026-03-30 16:48:23');

-- Update sequences to current max values
SELECT setval('users_id_seq', (SELECT MAX(id) FROM "users"));
SELECT setval('appointments_id_seq', (SELECT MAX(id) FROM "appointments"));
SELECT setval('personal_access_tokens_id_seq', (SELECT MAX(id) FROM "personal_access_tokens"));

-- Migration complete!
-- You should now see:
-- - 2 users (1 admin, 1 patient)
-- - 11 appointments with various statuses
-- - Existing authentication tokens
