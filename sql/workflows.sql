-- ============================================================
--  EVEE CRM - Automation Workflows (Workflow (active) / (finished) filters)
--  Safe to re-run: CREATE TABLE IF NOT EXISTS + idempotent seed
--  Run with: E:\xampp\mysql\bin\mysql.exe -u root < sql\workflows.sql
-- ============================================================

USE evee_crm;

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
  ('Welcome Automation',            'active',   'Greets new leads and introduces Evee models'),
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