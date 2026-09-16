-- ============================================================
--  EVEE CRM - Form builder persistence
--    C:\xampp\mysql\bin\mysql.exe -u root < sql\forms.sql
--
--  Stores every form created in the Forms dashboard so it
--  survives page refreshes and is shared across browsers.
--  NOTE: the API also auto-creates this table on first use,
--  running this file is optional.
-- ============================================================
USE evee_crm;

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
