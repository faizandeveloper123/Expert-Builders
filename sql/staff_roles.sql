-- ============================================================
--  EVEE CRM - Staff User Roles (Admin / Dealer / Follower)
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

USE evee_crm;

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
  WHERE TABLE_SCHEMA = 'evee_crm'
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