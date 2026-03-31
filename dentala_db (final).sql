-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 30, 2026 at 09:47 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `dentala_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `full_name` varchar(255) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `service_type` varchar(255) NOT NULL,
  `custom_service` varchar(255) DEFAULT NULL,
  `preferred_dentist` varchar(255) NOT NULL,
  `medical_conditions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`medical_conditions`)),
  `others` varchar(255) DEFAULT NULL,
  `appointment_date` date NOT NULL,
  `preferred_time` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL COMMENT 'Appointment status: pending, confirmed, completed, cancelled, skipped',
  `booked_by_admin` tinyint(1) NOT NULL DEFAULT 0,
  `cancellation_reason` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`id`, `user_id`, `full_name`, `phone`, `email`, `service_type`, `custom_service`, `preferred_dentist`, `medical_conditions`, `others`, `appointment_date`, `preferred_time`, `status`, `booked_by_admin`, `cancellation_reason`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 3, 'Kung Ako Na Kasi', '09887653621', 'dariguezedrian@gmail.com', 'Tooth Extraction', NULL, 'mercedeskyla419@gmail.com', '[\"Cosmetic Improvement\"]', NULL, '2026-03-31', '11:00 AM', 'expired', 0, 'Automatically expired: Appointment time has passed without clinic action.', '2026-03-30 16:49:37', '2026-03-30 16:49:44', NULL),
(2, 3, 'Kung Ako Na Kasi', '09887653621', 'dariguezedrian@gmail.com', 'Dental Cleaning', NULL, 'mercedeskyla419@gmail.com', '[\"Bleeding Gums\",\"Bad Breath\",\"Loose Tooth\",\"Broken\\/Chipped Tooth\",\"Wisdom Tooth Pain\"]', NULL, '2026-04-02', '01:00 PM', 'cancelled', 0, 'ghdfghdfg', '2026-03-30 16:50:49', '2026-03-30 16:52:03', NULL),
(3, 3, 'Edrian Paul Dariguez', '09887653621', 'dariguezedrian@gmail.com', 'Dental Cleaning', NULL, 'mercedeskyla419@gmail.com', '[\"Bleeding Gums\"]', NULL, '2026-03-31', '11:00 AM', 'expired', 0, 'Automatically expired: Appointment time has passed without clinic action.', '2026-03-30 16:57:59', '2026-03-30 16:58:33', NULL),
(4, 3, 'Edrian Paul Dariguez', '09887653621', 'dariguezedrian@gmail.com', 'Tooth Filling', NULL, 'mercedeskyla419@gmail.com', '[]', NULL, '2026-04-01', '11:00 AM', 'declined', 0, 'HAHAHHHA', '2026-03-30 17:02:40', '2026-03-30 17:04:18', NULL),
(5, 3, 'Edrian Paul Dariguez', '09887653678', 'dariguezedrian@gmail.com', 'Tooth Filling', NULL, 'mercedeskyla419@gmail.com', '[\"Bleeding Gums\",\"Loose Tooth\"]', NULL, '2026-04-09', '01:00 PM', 'completed', 0, NULL, '2026-03-30 17:03:12', '2026-03-30 17:07:59', NULL),
(6, 3, 'Edrian Paul Dariguez', '09887653678', 'dariguezedrian@gmail.com', 'Tooth Extraction', NULL, 'mercedeskyla419@gmail.com', '[]', NULL, '2026-04-02', '09:00 AM', 'declined', 0, 'adsfasdfasd', '2026-03-30 17:22:04', '2026-03-30 17:45:16', NULL),
(7, 3, 'Edrian Paul Dariguez', '09887653621', 'dariguezedrian@gmail.com', 'Teeth Whitening', NULL, 'mercedeskyla419@gmail.com', '[\"Bleeding Gums\"]', NULL, '2026-04-01', '01:00 PM', 'no-show', 0, 'AJAJAJAJAJAJAJ', '2026-03-30 17:45:54', '2026-03-30 17:46:48', NULL),
(8, 3, 'Edrian Paul Dariguez', '09333333333', 'dariguezedrian@gmail.com', 'Tooth Extraction', NULL, 'mercedeskyla419@gmail.com', '[\"Cosmetic Improvement\"]', NULL, '2026-04-02', '09:00 AM', 'cancelled', 0, 'FGFGSD', '2026-03-30 17:47:25', '2026-03-30 17:47:51', NULL),
(9, NULL, 'Kaka Cell P. honeMoyan', '09222323232', 'dariguezedrian@gmail.com', 'Dental Cleaning', NULL, 'mercedeskyla419@gmail.com', '\"[\\\"Bad Breath\\\",\\\"Cosmetic Improvement\\\"]\"', NULL, '2026-04-01', '07:00 AM', 'completed', 1, NULL, '2026-03-30 17:48:32', '2026-03-30 18:03:08', NULL),
(10, NULL, 'Venus Mars Saturn', '09976876786', 'dariguezedrian@gmail.com', 'Regular Checkup', NULL, 'mercedeskyla419@gmail.com', '\"[\\\"Bleeding Gums\\\",\\\"Bad Breath\\\"]\"', NULL, '2026-04-22', '07:00 AM', 'no-show', 1, 'fgdsdfg', '2026-03-30 18:03:42', '2026-03-30 18:08:06', NULL),
(11, NULL, 'Venus Mars Saturn', '09777777777', 'dariguezedrian@gmail.com', 'Tooth Filling', NULL, 'mercedeskyla419@gmail.com', '\"[\\\"Bad Breath\\\",\\\"Cosmetic Improvement\\\"]\"', NULL, '2026-04-28', '07:00 AM', 'completed', 1, NULL, '2026-03-30 18:07:15', '2026-03-30 18:07:59', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `verification_token` varchar(255) DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 'App\\Models\\User', 2, 'auth_token', 'ec3255f889a4d498057acf2e02a4dee40a64df4b4bbf6cb5af02d9c6a056dd2f', '[\"*\"]', NULL, NULL, '2026-03-30 16:35:54', '2026-03-30 16:35:54'),
(3, 'App\\Models\\User', 2, 'auth_token', 'a5c79f1f7d7a674007d1f2d82736831f1788f92c9cd60a1446c4a042aa125168', '[\"*\"]', '2026-03-30 19:46:37', NULL, '2026-03-30 16:39:38', '2026-03-30 19:46:37'),
(4, 'App\\Models\\User', 3, 'auth_token', 'bcb1afd24ba84fb3a716a0269c33e85eb96a3a3a734e390ca06a8fbde189355b', '[\"*\"]', NULL, NULL, '2026-03-30 16:48:23', '2026-03-30 16:48:23'),
(5, 'App\\Models\\User', 3, 'auth_token', '0da61ce424d8cb06d0bdd9e3559cc44dcdfa6572d89fb383d1f0cf84fc549a9c', '[\"*\"]', '2026-03-30 18:02:57', NULL, '2026-03-30 16:49:02', '2026-03-30 18:02:57');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `profile_photo_path` varchar(2048) DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL DEFAULT 'patient',
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `name`, `phone`, `profile_photo_path`, `email_verified_at`, `password`, `role`, `remember_token`, `created_at`, `updated_at`) VALUES
(2, 'mercedeskyla419@gmail.com', 'Hin D. Sadboi', '09333333333', NULL, NULL, '$2y$12$.5KgdWu1zjzhBemUeeHIJusJ9YIklWkJuFu6rWZUP2VDoDyeZnd0S', 'admin', NULL, '2026-03-30 16:35:54', '2026-03-30 16:35:54'),
(3, 'dariguezedrian@gmail.com', NULL, '09887653678', NULL, NULL, '$2y$12$uU8/2Im6twjy3LpiRVU/NO5Qhs4q./hm5DGeK7n2zhfL4ZmDx6jlO', 'patient', NULL, '2026-03-30 16:48:23', '2026-03-30 16:48:23');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `appointments_user_id_foreign` (`user_id`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_reserved_at_available_at_index` (`queue`,`reserved_at`,`available_at`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD KEY `password_resets_email_index` (`email`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
