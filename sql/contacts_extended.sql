-- ============================================================
--  EVEE CRM - Extended contact fields + staff password migration
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

USE evee_crm;

-- ------------------------------------------------------------
-- 1) CONTACTS -> custom_fields (JSON)
-- ------------------------------------------------------------
SET @cf_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'evee_crm'
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
  WHERE TABLE_SCHEMA = 'evee_crm'
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
  WHERE TABLE_SCHEMA = 'evee_crm'
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
