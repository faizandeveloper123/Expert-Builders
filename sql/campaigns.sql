-- ============================================================
--  EVEE CRM - Campaigns (for Active / Paused / Canceled / Finished campaign filters)
--  Safe to re-run: CREATE TABLE IF NOT EXISTS + idempotent seed
--  Run with: E:\xampp\mysql\bin\mysql.exe -u root < sql\campaigns.sql
-- ============================================================

USE evee_crm;

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