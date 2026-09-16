-- ============================================================
--  EVEE CRM - Contact-related entities (right-side windows)
--  Tables: opportunities, tasks, notes, appointments
--  Safe to re-run: uses CREATE TABLE IF NOT EXISTS
--  Run with: C:\xampp\mysql\bin\mysql.exe -u root < sql\contact_related.sql
-- ============================================================

USE evee_crm;

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
