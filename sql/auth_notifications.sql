-- ============================================================
--  EVEE CRM - Auth + Notifications Migration
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

USE evee_crm;

-- ------------------------------------------------------------
-- 1) GUARANTEE staff_users.password EXISTS
-- ------------------------------------------------------------
SET @pw_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'evee_crm'
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