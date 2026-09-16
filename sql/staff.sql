-- ============================================================
--  EVEE CRM - Staff Users (My Staff / Settings) Migration
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

USE evee_crm;

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
  WHERE TABLE_SCHEMA = 'evee_crm'
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
