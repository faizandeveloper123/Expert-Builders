-- ============================================================
--  AGENCY CRM  - MASTER DATABASE (merged from every SQL file)
--  Generated automatically from the expert-builders sql/ set
--
--  HOW TO IMPORT
--    1. StackCP -> MySQL Databases -> create database "agency"
--    2. phpMyAdmin -> open the "agency" database -> Import tab
--    3. Upload this file -> Go
--
--  Note: there are NO CREATE DATABASE / USE statements inside,
--  so it imports cleanly no matter what the real DB is called.
--  Tested on MariaDB 10.4 (StackCP).
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
/*!40101 SET NAMES utf8mb4 */;

/* ========================================================================== */
/*  PART 1  - CORE TABLES + SEED DATA  (Source: evee_crm.sql) */
/* ========================================================================== */

-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 09, 2026 at 06:37 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `evee_crm`
--

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` int(10) UNSIGNED NOT NULL,
  `contact_id` int(10) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL DEFAULT '',
  `calendar` varchar(150) NOT NULL DEFAULT '',
  `host` varchar(120) NOT NULL DEFAULT '',
  `date` varchar(20) NOT NULL DEFAULT '',
  `start_time` varchar(20) NOT NULL DEFAULT '',
  `end_time` varchar(20) NOT NULL DEFAULT '',
  `location` varchar(150) NOT NULL DEFAULT '',
  `status` varchar(50) NOT NULL DEFAULT 'Completed',
  `notes` text DEFAULT NULL,
  `category` varchar(20) NOT NULL DEFAULT 'past',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`id`, `contact_id`, `title`, `calendar`, `host`, `date`, `start_time`, `end_time`, `location`, `status`, `notes`, `category`, `created_at`) VALUES
(3, 12, 'Test Ride & Sales Consultation', 'Sales Consultation Calendar', 'Asad B Zaman', '2026-08-08', '10:00 AM', '10:30 AM', 'Google Meet Video Link', 'Completed', 'Customer requested a test ride for Expert Builders consultation.', 'past', '2026-08-09 17:58:29'),
(4, 12, 'Out of office / Slot Blocked', 'General Support Calendar', 'Asad B Zaman', '2026-08-09', '09:00 AM', '05:00 PM', 'Calendar Lock', 'Blocked', NULL, 'past', '2026-08-09 17:58:39');

-- --------------------------------------------------------

--
-- Table structure for table `contacts`
--

CREATE TABLE `contacts` (
  `id` int(10) UNSIGNED NOT NULL,
  `first_name` varchar(100) NOT NULL DEFAULT '',
  `last_name` varchar(100) NOT NULL DEFAULT '',
  `full_name` varchar(201) GENERATED ALWAYS AS (concat(`first_name`,' ',`last_name`)) STORED,
  `phone` varchar(40) DEFAULT NULL,
  `email` varchar(190) DEFAULT NULL,
  `business_name` varchar(190) DEFAULT NULL,
  `contact_type` enum('','Lead','Customer','Vendor','Partner') NOT NULL DEFAULT '',
  `is_lead` tinyint(1) NOT NULL DEFAULT 0,
  `avatar_color` varchar(60) NOT NULL DEFAULT 'bg-emerald-200 text-emerald-800',
  `avatar_data` mediumtext DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `last_activity_at` datetime DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `contacts`
--

INSERT INTO `contacts` (`id`, `first_name`, `last_name`, `phone`, `email`, `business_name`, `contact_type`, `is_lead`, `avatar_color`, `avatar_data`, `notes`, `created_at`, `last_activity_at`, `updated_at`) VALUES
(1, 'Muhammad', 'Faizan', '0371 1520951', 'faizan@gmail.com', 'Expert Builders', 'Lead', 1, 'bg-emerald-200 text-emerald-800', NULL, NULL, '2026-08-08 15:50:00', NULL, '2026-08-08 22:41:47'),
(2, 'Tahira', 'Abbas', '0371 1520051', 'orixzylum@gmail.com', NULL, '', 0, 'bg-sky-200 text-sky-800', NULL, NULL, '2026-08-08 14:06:00', NULL, '2026-08-08 22:41:47'),
(3, '(Example) Casey', 'Mo...', '+16541234567', NULL, '(Example) Dunder Miff...', '', 0, 'bg-purple-200 text-purple-800', NULL, NULL, '2026-08-08 13:32:00', NULL, '2026-08-08 22:41:47'),
(4, '(Example) Taylor', 'Re...', '+178655689546', NULL, '(Example) MacLaren\'s...', '', 0, 'bg-sky-200 text-sky-800', NULL, NULL, '2026-08-08 13:32:00', NULL, '2026-08-08 22:41:47'),
(5, '(Example) Jordan', 'S...', NULL, 'jordan.smith@exampl...', '(Example) MacLaren\'s...', '', 0, 'bg-blue-200 text-blue-800', NULL, NULL, '2026-08-08 13:32:00', NULL, '2026-08-08 22:41:47'),
(6, '(Example) Alex', 'Doe ...', NULL, 'alex.carter@business...', '(Example) Goliath Nati...', '', 0, 'bg-indigo-200 text-indigo-800', NULL, NULL, '2026-08-08 13:31:00', NULL, '2026-08-08 22:41:47'),
(7, '(Example) Riley', 'Ben...', '+13141236547', 'riley.bennett@corpor...', '(Example) Goliath Nati...', 'Lead', 1, 'bg-emerald-200 text-emerald-800', NULL, NULL, '2026-08-08 13:31:00', NULL, '2026-08-08 22:41:47'),
(9, 'Waheed', 'Muraad', '+92 3249837880', 'waheed@gmail.com', NULL, 'Lead', 1, 'bg-purple-200 text-purple-800', NULL, NULL, '2026-08-08 22:53:21', NULL, '2026-08-08 22:53:21'),
(12, 'John', 'Doe', NULL, NULL, NULL, 'Lead', 1, 'bg-amber-200 text-amber-800', NULL, NULL, '2026-08-08 23:03:22', NULL, '2026-08-08 23:03:22');

-- --------------------------------------------------------

--
-- Table structure for table `contact_tags`
--

CREATE TABLE `contact_tags` (
  `contact_id` int(10) UNSIGNED NOT NULL,
  `tag_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `contact_tags`
--

INSERT INTO `contact_tags` (`contact_id`, `tag_id`) VALUES
(1, 1),
(3, 4),
(3, 5),
(4, 4),
(5, 4),
(6, 4),
(7, 1),
(7, 5),
(9, 6),
(12, 6);

-- --------------------------------------------------------

--
-- Table structure for table `notes`
--

CREATE TABLE `notes` (
  `id` int(10) UNSIGNED NOT NULL,
  `contact_id` int(10) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL DEFAULT 'Note',
  `content` text DEFAULT NULL,
  `author` varchar(120) NOT NULL DEFAULT 'Asad B Zaman',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `opportunities`
--

CREATE TABLE `opportunities` (
  `id` int(10) UNSIGNED NOT NULL,
  `contact_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL DEFAULT '',
  `pipeline` varchar(100) NOT NULL DEFAULT 'Marketing Pipeline',
  `stage` varchar(100) NOT NULL DEFAULT 'New Lead',
  `status` varchar(50) NOT NULL DEFAULT 'Open',
  `value` varchar(100) NOT NULL DEFAULT 'Rs 0',
  `business_name` varchar(255) NOT NULL DEFAULT '',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `opportunities`
--

INSERT INTO `opportunities` (`id`, `contact_id`, `name`, `pipeline`, `stage`, `status`, `value`, `business_name`, `created_at`) VALUES
(2, 12, 'John Doe', 'Marketing Pipeline', 'New Lead', 'Open', 'Rs 0', 'Expert Builders', '2026-08-09 17:53:05');

-- --------------------------------------------------------

--
-- Table structure for table `tags`
--

CREATE TABLE `tags` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(60) NOT NULL,
  `color` varchar(30) NOT NULL DEFAULT 'bg-slate-100 text-slate-600'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tags`
--

INSERT INTO `tags` (`id`, `name`, `color`) VALUES
(1, 'warm lead', 'bg-amber-50 text-amber-700'),
(2, 'hot lead', 'bg-rose-50 text-rose-700'),
(3, 'cold lead', 'bg-slate-100 text-slate-600'),
(4, 'follow-up', 'bg-blue-50 text-blue-700'),
(5, 'customer', 'bg-green-50 text-green-700'),
(6, 'lead', 'bg-slate-100 text-slate-600');

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `id` int(10) UNSIGNED NOT NULL,
  `contact_id` int(10) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL DEFAULT '',
  `status` varchar(50) NOT NULL DEFAULT 'Pending',
  `due_date` varchar(120) NOT NULL DEFAULT '',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_contacts_with_tags`
-- (See below for the actual view)
--
CREATE TABLE `v_contacts_with_tags` (
`id` int(10) unsigned
,`name` varchar(201)
,`first_name` varchar(100)
,`last_name` varchar(100)
,`phone` varchar(40)
,`email` varchar(190)
,`business_name` varchar(190)
,`contact_type` enum('','Lead','Customer','Vendor','Partner')
,`is_lead` tinyint(1)
,`avatar_color` varchar(60)
,`avatar_data` mediumtext
,`notes` text
,`created_at` datetime
,`last_activity_at` datetime
,`updated_at` datetime
,`tags` mediumtext
,`tag_ids` mediumtext
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_leads`
-- (See below for the actual view)
--
CREATE TABLE `v_leads` (
`id` int(10) unsigned
,`name` varchar(201)
,`first_name` varchar(100)
,`last_name` varchar(100)
,`phone` varchar(40)
,`email` varchar(190)
,`business_name` varchar(190)
,`contact_type` enum('','Lead','Customer','Vendor','Partner')
,`is_lead` tinyint(1)
,`avatar_color` varchar(60)
,`avatar_data` mediumtext
,`notes` text
,`created_at` datetime
,`last_activity_at` datetime
,`updated_at` datetime
,`tags` mediumtext
,`tag_ids` mediumtext
);

-- --------------------------------------------------------

--
-- Structure for view `v_contacts_with_tags`
--
DROP TABLE IF EXISTS `v_contacts_with_tags`;

CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_contacts_with_tags`  AS SELECT `c`.`id` AS `id`, `c`.`full_name` AS `name`, `c`.`first_name` AS `first_name`, `c`.`last_name` AS `last_name`, `c`.`phone` AS `phone`, `c`.`email` AS `email`, `c`.`business_name` AS `business_name`, `c`.`contact_type` AS `contact_type`, `c`.`is_lead` AS `is_lead`, `c`.`avatar_color` AS `avatar_color`, `c`.`avatar_data` AS `avatar_data`, `c`.`notes` AS `notes`, `c`.`created_at` AS `created_at`, `c`.`last_activity_at` AS `last_activity_at`, `c`.`updated_at` AS `updated_at`, coalesce(group_concat(`t`.`name` order by `t`.`name` ASC separator ','),'') AS `tags`, coalesce(group_concat(`t`.`id` order by `t`.`name` ASC separator ','),'') AS `tag_ids` FROM ((`contacts` `c` left join `contact_tags` `ct` on(`ct`.`contact_id` = `c`.`id`)) left join `tags` `t` on(`t`.`id` = `ct`.`tag_id`)) GROUP BY `c`.`id` ;

-- --------------------------------------------------------

--
-- Structure for view `v_leads`
--
DROP TABLE IF EXISTS `v_leads`;

CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_leads`  AS SELECT `v_contacts_with_tags`.`id` AS `id`, `v_contacts_with_tags`.`name` AS `name`, `v_contacts_with_tags`.`first_name` AS `first_name`, `v_contacts_with_tags`.`last_name` AS `last_name`, `v_contacts_with_tags`.`phone` AS `phone`, `v_contacts_with_tags`.`email` AS `email`, `v_contacts_with_tags`.`business_name` AS `business_name`, `v_contacts_with_tags`.`contact_type` AS `contact_type`, `v_contacts_with_tags`.`is_lead` AS `is_lead`, `v_contacts_with_tags`.`avatar_color` AS `avatar_color`, `v_contacts_with_tags`.`avatar_data` AS `avatar_data`, `v_contacts_with_tags`.`notes` AS `notes`, `v_contacts_with_tags`.`created_at` AS `created_at`, `v_contacts_with_tags`.`last_activity_at` AS `last_activity_at`, `v_contacts_with_tags`.`updated_at` AS `updated_at`, `v_contacts_with_tags`.`tags` AS `tags`, `v_contacts_with_tags`.`tag_ids` AS `tag_ids` FROM `v_contacts_with_tags` WHERE `v_contacts_with_tags`.`is_lead` = 1 OR `v_contacts_with_tags`.`contact_type` = 'Lead' OR find_in_set('warm lead',`v_contacts_with_tags`.`tags`) OR find_in_set('hot lead',`v_contacts_with_tags`.`tags`) OR find_in_set('cold lead',`v_contacts_with_tags`.`tags`) ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_appt_contact` (`contact_id`);

--
-- Indexes for table `contacts`
--
ALTER TABLE `contacts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_contact_phone` (`phone`),
  ADD UNIQUE KEY `uq_contact_email` (`email`),
  ADD KEY `idx_contact_name` (`last_name`,`first_name`),
  ADD KEY `idx_contact_type` (`contact_type`),
  ADD KEY `idx_contact_lead` (`is_lead`),
  ADD KEY `idx_contact_created` (`created_at`),
  ADD KEY `idx_contact_activity` (`last_activity_at`);
ALTER TABLE `contacts` ADD FULLTEXT KEY `ft_contact_search` (`first_name`,`last_name`,`email`,`business_name`);

--
-- Indexes for table `contact_tags`
--
ALTER TABLE `contact_tags`
  ADD PRIMARY KEY (`contact_id`,`tag_id`),
  ADD KEY `idx_contact_tags_tag` (`tag_id`);

--
-- Indexes for table `notes`
--
ALTER TABLE `notes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_note_contact` (`contact_id`);

--
-- Indexes for table `opportunities`
--
ALTER TABLE `opportunities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_opp_contact` (`contact_id`);

--
-- Indexes for table `tags`
--
ALTER TABLE `tags`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_tag_name` (`name`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_task_contact` (`contact_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `contacts`
--
ALTER TABLE `contacts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `notes`
--
ALTER TABLE `notes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `opportunities`
--
ALTER TABLE `opportunities`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tags`
--
ALTER TABLE `tags`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `fk_appt_contact` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `contact_tags`
--
ALTER TABLE `contact_tags`
  ADD CONSTRAINT `fk_ct_contact` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ct_tag` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notes`
--
ALTER TABLE `notes`
  ADD CONSTRAINT `fk_note_contact` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `opportunities`
--
ALTER TABLE `opportunities`
  ADD CONSTRAINT `fk_opp_contact` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `fk_task_contact` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

/* ========================================================================== */
/*  PART 2  - OPPORTUNITIES / TASKS / NOTES / APPOINTMENTS  (Source: sql\contact_related.sql) */
/* ========================================================================== */

-- ============================================================
--  EXPERT BUILDERS CRM - Contact-related entities (right-side windows)
--  Tables: opportunities, tasks, notes, appointments
--  Safe to re-run: uses CREATE TABLE IF NOT EXISTS
--  Run with: C:\xampp\mysql\bin\mysql.exe -u root < sql\contact_related.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS opportunities (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  contact_id          INT UNSIGNED NOT NULL,
  name                VARCHAR(255) NOT NULL DEFAULT '',
  pipeline            VARCHAR(100) NOT NULL DEFAULT 'Marketing Pipeline',
  stage               VARCHAR(100) NOT NULL DEFAULT 'New Lead',
  status              VARCHAR(50)  NOT NULL DEFAULT 'Open',
  value               VARCHAR(100) NOT NULL DEFAULT 'Rs 0',
  business_name       VARCHAR(255) NOT NULL DEFAULT '',
  source              VARCHAR(255) NOT NULL DEFAULT '',
  expected_close_date VARCHAR(50)  NOT NULL DEFAULT '',
  tags                VARCHAR(500) NOT NULL DEFAULT '',
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_opp_contact (contact_id),
  CONSTRAINT fk_opp_contact FOREIGN KEY (contact_id)
    REFERENCES contacts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Safe upgrade for existing DBs (MariaDB supports ADD COLUMN IF NOT EXISTS)
ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS source VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS expected_close_date VARCHAR(50) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tags VARCHAR(500) NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS tasks (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  contact_id INT UNSIGNED NOT NULL,
  title      VARCHAR(255) NOT NULL DEFAULT '',
  status     VARCHAR(50)  NOT NULL DEFAULT 'Pending',
  due_date   VARCHAR(120) NOT NULL DEFAULT '',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_task_contact (contact_id),
  CONSTRAINT fk_task_contact FOREIGN KEY (contact_id)
    REFERENCES contacts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notes (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  contact_id     INT UNSIGNED NOT NULL,
  title          VARCHAR(255) NOT NULL DEFAULT 'Note',
  content        TEXT         DEFAULT NULL,
  author         VARCHAR(120) NOT NULL DEFAULT 'Asad B Zaman',
  note_color     VARCHAR(50)  NOT NULL DEFAULT '',
  attachments    VARCHAR(1000) NOT NULL DEFAULT '',
  associated_to  VARCHAR(120) NOT NULL DEFAULT '',
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_note_contact (contact_id),
  CONSTRAINT fk_note_contact FOREIGN KEY (contact_id)
    REFERENCES contacts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Safe upgrade for existing DBs
ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS note_color VARCHAR(50) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS attachments VARCHAR(1000) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS associated_to VARCHAR(120) NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS appointments (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  contact_id INT UNSIGNED NOT NULL,
  title      VARCHAR(255) NOT NULL DEFAULT '',
  calendar   VARCHAR(150) NOT NULL DEFAULT '',
  host       VARCHAR(120) NOT NULL DEFAULT '',
  date       VARCHAR(20)  NOT NULL DEFAULT '',
  start_time VARCHAR(20)  NOT NULL DEFAULT '',
  end_time   VARCHAR(20)  NOT NULL DEFAULT '',
  location   VARCHAR(150) NOT NULL DEFAULT '',
  status     VARCHAR(50)  NOT NULL DEFAULT 'Completed',
  notes      TEXT         DEFAULT NULL,
  category   VARCHAR(20)  NOT NULL DEFAULT 'past',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_appt_contact (contact_id),
  CONSTRAINT fk_appt_contact FOREIGN KEY (contact_id)
    REFERENCES contacts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ========================================================================== */
/*  PART 3  - STAFF_USERS (roles, permissions, DP) + assigned_to  (Source: sql\staff.sql) */
/* ========================================================================== */

-- ============================================================
--  EXPERT BUILDERS CRM - Staff Users (My Staff / Settings) Migration
--  XAMPP MySQL (MariaDB 10.4+)
--
--  Adds:
--   1. staff_users table (team members w/ roles + permissions + DP)
--   2. contacts.assigned_to column (which staff owns a contact/lead)
--   3. Rebuilt v_contacts_with_tags / v_leads to expose assigned staff
--   4. Seed 2 demo staff users (X Y Admin, Sarah Jenkins User)
--
--  How to run (idempotent):
--    C:\xampp\mysql\bin\mysql.exe -u root < sql\staff.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1) STAFF USERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_users (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  first_name       VARCHAR(100) NOT NULL DEFAULT '',
  last_name        VARCHAR(100) NOT NULL DEFAULT '',
  full_name        VARCHAR(201) GENERATED ALWAYS AS (CONCAT(first_name, ' ', last_name)) STORED,
  email            VARCHAR(190) DEFAULT NULL,
  phone            VARCHAR(40)  DEFAULT NULL,
  extension        VARCHAR(20)  DEFAULT NULL,
  user_type        ENUM('Admin', 'User') NOT NULL DEFAULT 'User',
  system_id        VARCHAR(60)  DEFAULT NULL,
  calendar         VARCHAR(190) DEFAULT NULL,
  restrict_data    TINYINT(1)   NOT NULL DEFAULT 0,
  signature        TEXT         DEFAULT NULL,
  avatar_data      MEDIUMTEXT   DEFAULT NULL,
  call_voicemail   TEXT         DEFAULT NULL,   -- JSON
  availability     TEXT         DEFAULT NULL,   -- JSON
  calendar_config  TEXT         DEFAULT NULL,   -- JSON
  permissions      LONGTEXT     DEFAULT NULL,   -- JSON map  cat:item -> bool
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_staff_email (email),
  KEY idx_staff_type (user_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2) CONTACTS -> ASSIGNED STAFF OWNER
--    (idempotent: only adds the column if it doesn't exist yet)
-- ------------------------------------------------------------
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'contacts'
    AND COLUMN_NAME  = 'assigned_to'
);
SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE contacts ADD COLUMN assigned_to INT UNSIGNED DEFAULT NULL AFTER avatar_data',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- 3) REBUILD VIEWS to include assigned staff info
--    (drop children first, then parent, recreate in order)
-- ------------------------------------------------------------
DROP VIEW IF EXISTS v_leads;
DROP VIEW IF EXISTS v_contacts_with_tags;

CREATE VIEW v_contacts_with_tags AS
SELECT
  c.id,
  c.full_name            AS name,
  c.first_name,
  c.last_name,
  c.phone,
  c.email,
  c.business_name,
  c.contact_type,
  c.is_lead,
  c.avatar_color,
  c.avatar_data,
  c.assigned_to,
  CONCAT(s.first_name, ' ', s.last_name) AS assigned_to_name,
  s.avatar_data AS assigned_to_avatar,
  c.notes,
  c.created_at,
  c.last_activity_at,
  c.updated_at,
  COALESCE(GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR ','), '') AS tags,
  COALESCE(GROUP_CONCAT(t.id   ORDER BY t.name SEPARATOR ','), '') AS tag_ids
FROM contacts c
LEFT JOIN staff_users s ON s.id = c.assigned_to
LEFT JOIN contact_tags ct ON ct.contact_id = c.id
LEFT JOIN tags t         ON t.id         = ct.tag_id
GROUP BY c.id;

CREATE VIEW v_leads AS
SELECT *
FROM v_contacts_with_tags
WHERE is_lead = 1
   OR contact_type = 'Lead'
   OR FIND_IN_SET('warm lead', tags)
   OR FIND_IN_SET('hot lead',  tags)
   OR FIND_IN_SET('cold lead', tags);

-- ------------------------------------------------------------
-- 4) SEED demo staff users (safe re-run)
-- ------------------------------------------------------------
INSERT INTO staff_users
  (first_name, last_name, email, phone, extension, user_type, system_id, calendar, restrict_data, signature, permissions)
VALUES
  ('X', 'Y', 'xy@gmail.com', '+92 371 1520953', '101', 'Admin',
   'FMmFaJdx3TCeG5kb61Ab', 'Main Sales Calendar', 0,
   '<p>Best regards,<br/><strong>X Y</strong><br/>Account Executive</p>',
   NULL),
  ('Sarah', 'Jenkins', 'sarah.j@hifimarketing.com', '+92 321 9876543', '104', 'User',
   'K9mPqRst7UVwX8yz12Ab', 'Customer Care Calendar', 1,
   '<p>Regards,<br/><strong>Sarah Jenkins</strong><br/>Support Specialist</p>',
   NULL)
ON DUPLICATE KEY UPDATE
  phone = VALUES(phone),
  extension = VALUES(extension),
  user_type = VALUES(user_type),
  calendar = VALUES(calendar),
  restrict_data = VALUES(restrict_data),
  signature = VALUES(signature);

/* ========================================================================== */
/*  PART 4  - STAFF ROLES ENUM (Admin/Dealer/Follower) + manager_id  (Source: sql\staff_roles.sql) */
/* ========================================================================== */

-- ============================================================
--  EXPERT BUILDERS CRM - Staff User Roles (Admin / Dealer / Follower)
--  XAMPP MySQL (MariaDB 10.4+)
--
--  Adds:
--   1. user_type enum extended to ('Admin','Dealer','Follower')
--   2. Existing 'User' rows become 'Dealer' (dealers are the sales
--      franchise users who get leads assigned to them).
--   3. manager_id column: which Dealer created/owns a Follower
--      (so the dealer's My Staff shows only their own followers and
--       the admin can see who a follower belongs to).
--
--  How to run (idempotent):
--    C:\xampp\mysql\bin\mysql.exe -u root < sql\staff_roles.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1) EXTEND user_type ENUM (idempotent via MODIFY)
-- ------------------------------------------------------------
ALTER TABLE staff_users
  MODIFY user_type ENUM('Admin', 'Dealer', 'Follower') NOT NULL DEFAULT 'Follower';

-- ------------------------------------------------------------
-- 2) MIGRATE existing 'User' accounts -> Dealer
--    (MariaDB turns values no longer in the new enum into '', so
--     match both 'User' and '' to be safe on re-runs.)
-- ------------------------------------------------------------
UPDATE staff_users SET user_type = 'Dealer' WHERE user_type IN ('User', '');

-- ------------------------------------------------------------
-- 3) manager_id column (which Dealer owns a Follower)
-- ------------------------------------------------------------
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'staff_users'
    AND COLUMN_NAME  = 'manager_id'
);
SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE staff_users ADD COLUMN manager_id INT UNSIGNED DEFAULT NULL AFTER user_type',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

/* ========================================================================== */
/*  PART 5  - CONTACTS custom_fields + STAFF password + rebuilt views  (Source: sql\contacts_extended.sql) */
/* ========================================================================== */

-- ============================================================
--  EXPERT BUILDERS CRM - Extended contact fields + staff password migration
--  XAMPP MySQL (MariaDB 10.4+)
--
--  Adds:
--   1. contacts.custom_fields  TEXT (JSON) - stores the extended
--      "All fields" tab data (multi emails/phones, DOB, website,
--      timezone, flooring project details, room photos, etc.)
--   2. staff_users.password   VARCHAR(255) - Add User password
--   3. Rebuilds v_contacts_with_tags / v_leads to expose the new col
--
--  How to run (idempotent):
--    E:\xampp\mysql\bin\mysql.exe -u root < sql\contacts_extended.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1) CONTACTS -> custom_fields (JSON)
-- ------------------------------------------------------------
SET @cf_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'contacts'
    AND COLUMN_NAME  = 'custom_fields'
);
SET @cf_sql = IF(
  @cf_exists = 0,
  'ALTER TABLE contacts ADD COLUMN custom_fields LONGTEXT DEFAULT NULL AFTER notes',
  'SELECT 1'
);
PREPARE stmt FROM @cf_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- 2) STAFF_USERS -> password
-- ------------------------------------------------------------
SET @pw_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'staff_users'
    AND COLUMN_NAME  = 'password'
);
SET @pw_sql = IF(
  @pw_exists = 0,
  'ALTER TABLE staff_users ADD COLUMN password VARCHAR(255) DEFAULT NULL AFTER email',
  'SELECT 1'
);
PREPARE stmt FROM @pw_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- 2b) CONTACTS -> assigned_to (staff owner). The dedicated staff.sql
--     migration may not have been applied to this database yet, so make
--     sure the owner column exists too.
-- ------------------------------------------------------------
SET @at_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'contacts'
    AND COLUMN_NAME  = 'assigned_to'
);
SET @at_sql = IF(
  @at_exists = 0,
  'ALTER TABLE contacts ADD COLUMN assigned_to INT UNSIGNED DEFAULT NULL AFTER avatar_data',
  'SELECT 1'
);
PREPARE stmt FROM @at_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- 3) REBUILD VIEWS to include custom_fields + assigned staff
-- ------------------------------------------------------------
DROP VIEW IF EXISTS v_leads;
DROP VIEW IF EXISTS v_contacts_with_tags;

CREATE VIEW v_contacts_with_tags AS
SELECT
  c.id,
  c.full_name            AS name,
  c.first_name,
  c.last_name,
  c.phone,
  c.email,
  c.business_name,
  c.contact_type,
  c.is_lead,
  c.avatar_color,
  c.avatar_data,
  c.assigned_to,
  CONCAT(s.first_name, ' ', s.last_name) AS assigned_to_name,
  s.avatar_data AS assigned_to_avatar,
  c.notes,
  c.custom_fields,
  c.created_at,
  c.last_activity_at,
  c.updated_at,
  COALESCE(GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR ','), '') AS tags,
  COALESCE(GROUP_CONCAT(t.id   ORDER BY t.name SEPARATOR ','), '') AS tag_ids
FROM contacts c
LEFT JOIN staff_users s ON s.id = c.assigned_to
LEFT JOIN contact_tags ct ON ct.contact_id = c.id
LEFT JOIN tags t         ON t.id         = ct.tag_id
GROUP BY c.id;

CREATE VIEW v_leads AS
SELECT *
FROM v_contacts_with_tags
WHERE is_lead = 1
   OR contact_type = 'Lead'
   OR FIND_IN_SET('warm lead', tags)
   OR FIND_IN_SET('hot lead',  tags)
   OR FIND_IN_SET('cold lead', tags);

/* ========================================================================== */
/*  PART 6  - AUTH PASSWORD SEED + NOTIFICATIONS TABLE  (Source: sql\auth_notifications.sql) */
/* ========================================================================== */

-- ============================================================
--  EXPERT BUILDERS CRM - Auth + Notifications Migration
--  XAMPP MySQL (MariaDB 10.4+)
--
--  Adds:
--   1. staff_users.password is guaranteed to exist (idempotent ALTER,
--      normally added by contacts_extended.sql). Logins use this column.
--   2. notifications table - in-app notifications for users when a
--      lead / follower / message is assigned to them.
--   3. Seed passwords for the two demo staff users so the app can be
--      logged into immediately (password: evee123).
--
--  How to run (idempotent):
--    C:\xampp\mysql\bin\mysql.exe -u root < sql\auth_notifications.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1) GUARANTEE staff_users.password EXISTS
-- ------------------------------------------------------------
SET @pw_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'staff_users'
    AND COLUMN_NAME  = 'password'
);
SET @sql = IF(
  @pw_exists = 0,
  'ALTER TABLE staff_users ADD COLUMN password VARCHAR(255) DEFAULT NULL AFTER email',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- 2) NOTIFICATIONS TABLE
--    A notification is created whenever something is assigned to a
--    staff user (lead owner, follower, @mention/message). The API
--    reads them per logged-in user; the bell shows unread counts.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  staff_id    INT UNSIGNED NOT NULL,
  contact_id  INT UNSIGNED DEFAULT NULL,
  type        VARCHAR(40)  NOT NULL DEFAULT 'assignment',
  title       VARCHAR(255) NOT NULL DEFAULT '',
  detail      VARCHAR(500) NOT NULL DEFAULT '',
  is_read     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_notif_staff (staff_id, is_read),
  KEY idx_notif_contact (contact_id),
  CONSTRAINT fk_notif_staff FOREIGN KEY (staff_id)
    REFERENCES staff_users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notif_contact FOREIGN KEY (contact_id)
    REFERENCES contacts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3) SEED DEFAULT PASSWORDS
--    Any staff user without a password gets "evee123" so the app can be
--    logged into immediately. Change these after the first login.
-- ------------------------------------------------------------
UPDATE staff_users
SET password = '$2y$10$g2eXcbHeSXn9ITpJFFvdi.vd3x3i8OZCD5jAdDcooPoinvrxuVI4q'
WHERE password IS NULL OR password = '';

/* ========================================================================== */
/*  PART 7  - SMART LISTS (multi-user)  (Source: sql\smart_lists.sql) */
/* ========================================================================== */

-- ============================================================
--  EXPERT BUILDERS CRM - Smart Lists (server-side, multi-user)
--  XAMPP MySQL (MariaDB 10.4+)
--
--  Adds:
--   1. smart_lists table: name, filters, sort, fields, members,
--      optional assigned dealer, created_by staff user.
--   2. smart_list_shares table: which staff users a list is shared
--      with (owner always sees it; a list with no share rows but
--      shared_all=1 is visible to every user).
--
--  How to run (idempotent):
--    E:\xampp\mysql\bin\mysql.exe -u root < sql\smart_lists.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS smart_lists (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(190) NOT NULL,
  filters       LONGTEXT     DEFAULT NULL,
  sort_by       VARCHAR(100) DEFAULT NULL,
  fields        LONGTEXT     DEFAULT NULL,
  members       LONGTEXT     DEFAULT NULL,
  dealer_id     INT UNSIGNED DEFAULT NULL,
  shared_all    TINYINT(1)   NOT NULL DEFAULT 0,
  created_by    INT UNSIGNED NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_sl_name_owner (created_by, name),
  KEY idx_sl_created_by (created_by),
  KEY idx_sl_dealer (dealer_id),
  KEY idx_sl_shared_all (shared_all)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS smart_list_shares (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  smart_list_id  INT UNSIGNED NOT NULL,
  user_id        INT UNSIGNED NOT NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_sls_list_user (smart_list_id, user_id),
  KEY idx_sls_user (user_id),
  CONSTRAINT fk_sls_list FOREIGN KEY (smart_list_id)
    REFERENCES smart_lists(id) ON DELETE CASCADE,
  CONSTRAINT fk_sls_user FOREIGN KEY (user_id)
    REFERENCES staff_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ========================================================================== */
/*  PART 8  - DEALER REGISTRATION (password_plain + approved)  (Source: sql\dealer_registration.sql) */
/* ========================================================================== */

-- ============================================================
--  EXPERT BUILDERS CRM - Dealer self-registration via website form
--  XAMPP MySQL (MariaDB 10.4+)
--
--  Adds:
--   1. staff_users.password_plain VARCHAR(255) - recoverable copy of
--      the password for accounts auto-created by the Dealership
--      Registration form, so the dealer can view it again under
--      Account settings.
--   2. staff_users.approved TINYINT(1) DEFAULT 1 - approval gate for
--      logins. Public registrations insert 0 (pending) and an Admin
--      approves them under Settings -> My Staff before they can log in.
--
--  The API also adds these columns lazily on first use; this file just
--  makes the steps explicit/idempotent.
--
--  How to run (idempotent):
--    C:\xampp\mysql\bin\mysql.exe -u root < sql\dealer_registration.sql
-- ============================================================

SET @pp_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'staff_users'
    AND COLUMN_NAME  = 'password_plain'
);
SET @pp_sql = IF(
  @pp_exists = 0,
  'ALTER TABLE staff_users ADD COLUMN password_plain VARCHAR(255) DEFAULT NULL AFTER password',
  'SELECT 1'
);
PREPARE stmt FROM @pp_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- 2) STAFF_USERS -> approved (login gate)
-- ------------------------------------------------------------
SET @ap_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'staff_users'
    AND COLUMN_NAME  = 'approved'
);
SET @ap_sql = IF(
  @ap_exists = 0,
  'ALTER TABLE staff_users ADD COLUMN approved TINYINT(1) NOT NULL DEFAULT 1 AFTER password_plain',
  'SELECT 1'
);
PREPARE stmt FROM @ap_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

/* ========================================================================== */
/*  PART 9  - DEALER DASHBOARD (assign + track status)  (Source: sql\dealer_dashboard.sql) */
/* ========================================================================== */

-- ============================================================
--  EXPERT BUILDERS CRM - Dealer / Franchise Lead Assignment & Tracking
--  XAMPP MySQL (MariaDB 10.4+)
--
--  Adds:
--   1. dealer_lead_status table: tracks the assignment + status of a
--      lead (contact) to a dealer (staff user), including whether the
--      dealer has contacted the lead, the response channel used
--      (email / sms / whatsapp / call), the response itself, and
--      whether the lead was closed.
--
--  How to run (idempotent):
--    E:\xampp\mysql\bin\mysql.exe -u root < sql\dealer_dashboard.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS dealer_lead_status (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  contact_id       INT UNSIGNED NOT NULL,
  dealer_id        INT UNSIGNED NOT NULL,
  status           ENUM('assigned','contacted','responded','no_response','closed') NOT NULL DEFAULT 'assigned',
  response_channel VARCHAR(30)  NOT NULL DEFAULT '',
  response_note    TEXT         DEFAULT NULL,
  contacted_at     DATETIME     DEFAULT NULL,
  responded_at     DATETIME     DEFAULT NULL,
  closed_at        DATETIME     DEFAULT NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_dealer_lead (contact_id, dealer_id),
  KEY idx_dls_dealer (dealer_id),
  KEY idx_dls_status (status),
  CONSTRAINT fk_dls_contact FOREIGN KEY (contact_id)
    REFERENCES contacts(id) ON DELETE CASCADE,
  CONSTRAINT fk_dls_dealer FOREIGN KEY (dealer_id)
    REFERENCES staff_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ========================================================================== */
/*  PART 10 - DEALER STAGE PIPELINE (v2)  (Source: sql\dealer_dashboard_stages.sql) */
/* ========================================================================== */

-- ============================================================
--  EXPERT BUILDERS CRM - Dealer Lead STAGE Pipeline (v2)
--  XAMPP MySQL (MariaDB 10.4+)
--
--  Replaces the simple status enum with a full stage pipeline so
--  a dealer can show exactly where a lead stands:
--
--    assigned     -> assigned to dealer, not yet contacted
--    contacted    -> dealer contacted the lead (via call/mail/sms/whatsapp)
--    interested   -> lead responded positively / wants details
--    negotiating  -> discussing price / finance / offer
--    follow_up    -> lead asked to be contacted later (delayed)
--    rejected     -> lead not interested
--    sold         -> lead bought the vehicle (success)
--
--  How to run (idempotent):
--    E:\xampp\mysql\bin\mysql.exe -u root < sql\dealer_dashboard_stages.sql
-- ============================================================

-- Map old statuses onto the new pipeline before changing the enum.
UPDATE dealer_lead_status
   SET status = CASE status
                  WHEN 'responded'    THEN 'interested'
                  WHEN 'no_response'  THEN 'follow_up'
                  WHEN 'closed'       THEN 'sold'
                  ELSE status
                END;

ALTER TABLE dealer_lead_status
  MODIFY COLUMN status ENUM(
    'assigned',
    'contacted',
    'interested',
    'negotiating',
    'follow_up',
    'rejected',
    'sold'
  ) NOT NULL DEFAULT 'assigned';

/* ========================================================================== */
/*  PART 11 - DEALER LEAD BUCKETS (v3, final statuses)  (Source: sql\dealer_dashboard_buckets.sql) */
/* ========================================================================== */

-- ============================================================
--  EXPERT BUILDERS CRM - Dealer Lead BUCKETS (v3)
--  XAMPP MySQL (MariaDB 10.4+)
--
--  Replaces the 7-stage pipeline with 5 simple buckets a dealer
--  drags / moves each lead into as they work it:
--
--    non_contacted  -> dealer has not contacted the lead yet
--    contacted      -> dealer contacted the lead (call/mail/sms/whatsapp)
--    closed         -> lead gave a date, will talk / contact later
--    customer       -> lead BOUGHT the bike (success)
--    rejected       -> lead refused, not buying
--
--  Mapping from the old stage enum:
--    assigned    -> non_contacted
--    contacted   -> contacted
--    interested  -> contacted      (positive contact)
--    negotiating -> contacted      (still in conversation)
--    follow_up   -> closed         (will talk later)
--    rejected    -> rejected
--    sold        -> customer       (bought)
--
--  How to run (idempotent):
--    E:\xampp\mysql\bin\mysql.exe -u root < sql\dealer_dashboard_buckets.sql
-- ============================================================

UPDATE dealer_lead_status
   SET status = CASE status
                  WHEN 'assigned'    THEN 'non_contacted'
                  WHEN 'interested'  THEN 'contacted'
                  WHEN 'negotiating' THEN 'contacted'
                  WHEN 'follow_up'   THEN 'closed'
                  WHEN 'sold'        THEN 'customer'
                  ELSE status
                END;

ALTER TABLE dealer_lead_status
  MODIFY COLUMN status ENUM(
    'non_contacted',
    'contacted',
    'closed',
    'customer',
    'rejected'
  ) NOT NULL DEFAULT 'non_contacted';

/* ========================================================================== */
/*  PART 12 - CAMPAIGNS  (Source: sql\campaigns.sql) */
/* ========================================================================== */

-- ============================================================
--  EXPERT BUILDERS CRM - Campaigns (for Active / Paused / Canceled / Finished campaign filters)
--  Safe to re-run: CREATE TABLE IF NOT EXISTS + idempotent seed
--  Run with: E:\xampp\mysql\bin\mysql.exe -u root < sql\campaigns.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS campaigns (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(255) NOT NULL,
  status      VARCHAR(50)  NOT NULL DEFAULT 'active',
  description VARCHAR(500) NOT NULL DEFAULT '',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_campaign_name (name),
  KEY idx_campaign_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO campaigns (name, status, description) VALUES
  ('Spring Test Ride Days',        'active',   'Weekly test ride event for new season models'),
  ('New Launch: E6 Sport',         'active',   'Marketing push for the E6 Sport launch'),
  ('Trade-In Boost',               'active',   'Higher trade-in offer for upgrade buyers'),
  ('Finance Partner Offers',       'active',   'Financing offers shared with partners'),
  ('Winter Clearance',             'paused',   'Seasonal clearance paused for summer'),
  ('Festival Offers',              'paused',   'Eid offers on hold'),
  ('Old Model Push',               'canceled', 'Retired campaign for previous generation'),
  ('Summer Clearance',             'canceled', 'Cancelled summer clearance run'),
  ('Ramadan Mega Deals',           'finished', 'Completed Ramadan discount campaign'),
  ('Year-End Sale',                'finished', 'Finished year-end sale drive'),
  ('Launch Event Lahore',          'finished', 'Completed launch event in Lahore'),
  ('Referral Rewards',             'finished', 'Finished referral bonus program')
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  description = VALUES(description);

/* ========================================================================== */
/*  PART 13 - WORKFLOWS  (Source: sql\workflows.sql) */
/* ========================================================================== */

-- ============================================================
--  EXPERT BUILDERS CRM - Automation Workflows (Workflow (active) / (finished) filters)
--  Safe to re-run: CREATE TABLE IF NOT EXISTS + idempotent seed
--  Run with: E:\xampp\mysql\bin\mysql.exe -u root < sql\workflows.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS workflows (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(255) NOT NULL,
  status      VARCHAR(50)  NOT NULL DEFAULT 'active',
  description VARCHAR(500) NOT NULL DEFAULT '',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_workflow_name (name),
  KEY idx_workflow_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO workflows (name, status, description) VALUES
  ('Welcome Automation',            'active',   'Greets new leads and introduces Expert Builders services'),
  ('New Lead Nurture',              'active',   'Follow-up sequence for fresh test-ride leads'),
  ('Abandoned Booking Follow-up',   'active',   'Chases unfinished appointment sign-ups'),
  ('Trade-In Lead Responder',       'active',   'Reacts to trade-in enquiries'),
  ('Interested In Financing',       'active',   'Sends financing options to qualifying leads'),
  ('Post-Purchase Care',            'finished', 'Completed onboarding sequence for buyers'),
  ('Festival Offer Blast',          'finished', 'Finished festive discount broadcast'),
  ('Winter Outreach Campaign',      'finished', 'Completed winter outreach workflow'),
  ('Old Model Upgrade Nudge',       'finished', 'Finished upgrade reminder workflow')
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  description = VALUES(description);

/* ========================================================================== */
/*  PART 14 - FORM BUILDER + INVOICES TABLES  (Source: sql\forms.sql) */
/* ========================================================================== */

-- ============================================================
--  EXPERT BUILDERS CRM - Form builder persistence
--    C:\xampp\mysql\bin\mysql.exe -u root < sql\forms.sql
--
--  Stores every form created in the Forms dashboard so it
--  survives page refreshes and is shared across browsers.
--  NOTE: the API also auto-creates this table on first use,
--  running this file is optional.
-- ============================================================

CREATE TABLE IF NOT EXISTS forms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(191) NOT NULL,
    updated_by VARCHAR(191) DEFAULT '',
    elements MEDIUMTEXT NULL,          -- JSON: FormElement[]
    header MEDIUMTEXT NULL,            -- JSON: FormHeader | null
    cols TINYINT NOT NULL DEFAULT 1,   -- 1 or 2 column layout
    campaign_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* ========================================================================== */
/*  PART 15 - FORM SUBMISSION SEED DATA  (Source: sql\form_submissions.sql) */
/* ========================================================================== */

-- ============================================================
--  EXPERT BUILDERS CRM - Form submission data on leads
--  Run AFTER contacts_extended.sql (custom_fields column)
--    C:\xampp\mysql\bin\mysql.exe -u root < sql\form_submissions.sql
--
--  Stored under custom_fields.form_submissions so the lead detail
--  "Form | <name>" accordions and the Manage Fields form columns
--  show exactly what was filled in on each form.
-- ============================================================

-- Muhammad Faizan -> submitted the Auto Dealer Contact Us form
UPDATE contacts SET custom_fields = JSON_OBJECT(
  'form_submissions', JSON_ARRAY(
    JSON_OBJECT(
      'formName', 'Auto Dealer Contact Us',
      'submittedOn', '2026-08-10 11:24:00',
      'values', JSON_OBJECT(
        'Full Name', 'Muhammad Faizan',
        'Phone', '0371 1520951',
        'Email', 'faizan@gmail.com',
        'Preferred Contact Method', 'Call',
        'Are you looking for', 'New Car',
        'Preferred Features (check all that apply)', 'Sunroof, Navigation',
        'I Consent to Receive SMS Notifications', 'I Consent to Receive SMS Notifications'
      )
    )
  )
) WHERE id = 1;

-- Tahira Abbas -> submitted the "Form 0" lead form
UPDATE contacts SET custom_fields = JSON_OBJECT(
  'form_submissions', JSON_ARRAY(
    JSON_OBJECT(
      'formName', 'Form 0',
      'submittedOn', '2026-08-10 09:12:00',
      'values', JSON_OBJECT(
        'First Name', 'Tahira',
        'Last Name', 'Abbas',
        'Phone', '0371 1520051',
        'Email', 'orixzylum@gmail.com'
      )
    )
  )
) WHERE id = 2;

-- (Example) Riley Bennett -> warm lead via the Auto Dealer form
UPDATE contacts SET custom_fields = JSON_OBJECT(
  'form_submissions', JSON_ARRAY(
    JSON_OBJECT(
      'formName', 'Auto Dealer Contact Us',
      'submittedOn', '2026-08-09 18:41:00',
      'values', JSON_OBJECT(
        'Full Name', 'Riley Bennett',
        'Phone', '+13141236547',
        'Email', 'riley.bennett@corpor...',
        'Preferred Contact Method', 'SMS',
        'Are you looking for', 'Service',
        'Preferred Features (check all that apply)', 'Backup Camera',
        'I Consent to Receive SMS Notifications', 'I Consent to Receive SMS Notifications'
      )
    )
  )
) WHERE id = 7;

/* ========================================================================== */
/*  PART 16 - MASTER ADMIN ACCOUNT  (Source: temp_admin.sql) */
/* ========================================================================== */

INSERT INTO staff_users (first_name, last_name, email, user_type, restrict_data, password, password_plain, approved) VALUES
('Admin', 'Expert Builders', 'expertdevelopers@gmail.com', 'Admin', 0,
'$2y$10$NSErJlyuCdtFvjSZ2JRhre1Kgu3jAAtSCxZCqu0sAH/0inOSP/lu.',
'Expertbuilders@2026', 1)
ON DUPLICATE KEY UPDATE
  password='$2y$10$NSErJlyuCdtFvjSZ2JRhre1Kgu3jAAtSCxZCqu0sAH/0inOSP/lu.',
  password_plain='Expertbuilders@2026',
  approved=1,
  user_type='Admin',
  first_name='Admin',
  last_name='Expert Builders';

/* ========================================================================== */
/*  PART 17 - TABLES THE API EXPECTS (contact_followers, contact_activities, form_images, portal_submissions) + SOFT-DELETE + FINAL VIEWS */
/* ========================================================================== */

CREATE TABLE IF NOT EXISTS contact_followers (
  contact_id INT UNSIGNED NOT NULL,
  staff_id   INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (contact_id, staff_id),
  KEY idx_cf_staff (staff_id),
  CONSTRAINT fk_cf_contact FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  CONSTRAINT fk_cf_staff  FOREIGN KEY (staff_id)   REFERENCES staff_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contact_activities (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  contact_id INT UNSIGNED NOT NULL,
  type       VARCHAR(40)  NOT NULL DEFAULT 'contact',
  title      VARCHAR(255) NOT NULL DEFAULT '',
  detail     TEXT DEFAULT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ca_contact (contact_id),
  CONSTRAINT fk_ca_contact FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS form_images (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  data       MEDIUMTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS portal_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(20) NOT NULL,
  code VARCHAR(24) DEFAULT '',
  name VARCHAR(255) DEFAULT '',
  email VARCHAR(255) DEFAULT '',
  phone VARCHAR(64) DEFAULT '',
  business_name VARCHAR(255) DEFAULT '',
  address VARCHAR(255) DEFAULT '',
  years_in_business VARCHAR(16) DEFAULT '',
  oem_dealer VARCHAR(16) DEFAULT '',
  province VARCHAR(64) DEFAULT '',
  city VARCHAR(64) DEFAULT '',
  property_ownership VARCHAR(64) DEFAULT '',
  structure VARCHAR(64) DEFAULT '',
  file_name VARCHAR(255) DEFAULT '',
  chassis_number VARCHAR(100) DEFAULT '',
  order_number VARCHAR(100) DEFAULT '',
  problem_category VARCHAR(120) DEFAULT '',
  reason TEXT,
  assigned_to INT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'new',
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ps_type (type),
  INDEX idx_ps_assigned (assigned_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Soft-delete column (matches api/index.php ensure_soft_delete_support)
SET @del_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contacts' AND COLUMN_NAME = 'deleted_at'
);
SET @del_sql = IF(@del_exists = 0,
  'ALTER TABLE contacts ADD COLUMN deleted_at DATETIME DEFAULT NULL AFTER notes',
  'SELECT 1');
PREPARE stmt FROM @del_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- FINAL VIEWS (soft-delete aware, staff + custom fields included)
DROP VIEW IF EXISTS v_leads;
DROP VIEW IF EXISTS v_contacts_with_tags;
CREATE VIEW v_contacts_with_tags AS
SELECT
  c.id,
  c.full_name            AS name,
  c.first_name,
  c.last_name,
  c.phone,
  c.email,
  c.business_name,
  c.contact_type,
  c.is_lead,
  c.avatar_color,
  c.avatar_data,
  c.assigned_to,
  CONCAT(s.first_name, ' ', s.last_name) AS assigned_to_name,
  s.avatar_data AS assigned_to_avatar,
  c.notes,
  c.deleted_at,
  c.custom_fields,
  c.created_at,
  c.last_activity_at,
  c.updated_at,
  COALESCE(GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR ','), '') AS tags,
  COALESCE(GROUP_CONCAT(t.id   ORDER BY t.name SEPARATOR ','), '') AS tag_ids
FROM contacts c
LEFT JOIN staff_users s ON s.id = c.assigned_to
LEFT JOIN contact_tags ct ON ct.contact_id = c.id
LEFT JOIN tags t         ON t.id         = ct.tag_id
WHERE c.deleted_at IS NULL
GROUP BY c.id;

CREATE VIEW v_leads AS
SELECT *
FROM v_contacts_with_tags
WHERE is_lead = 1
   OR contact_type = 'Lead'
   OR FIND_IN_SET('warm lead', tags)
   OR FIND_IN_SET('hot lead',  tags)
   OR FIND_IN_SET('cold lead', tags);

COMMIT;

