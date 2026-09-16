-- ============================================================
--  EVEE CRM - Dealer self-registration via website form
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

USE evee_crm;

SET @pp_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'evee_crm'
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
  WHERE TABLE_SCHEMA = 'evee_crm'
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
