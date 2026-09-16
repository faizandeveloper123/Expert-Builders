-- ============================================================
--  EVEE CRM - Dealer / Franchise Lead Assignment & Tracking
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

USE evee_crm;

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
