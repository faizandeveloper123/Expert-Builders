-- ============================================================
--  EVEE CRM - Smart Lists (server-side, multi-user)
--  XAMPP MySQL (MariaDB 10.4+)
--
--  Adds:
--   1. smart_lists table: name, filters, sort, fields, members,
--      optional assigned dealer, created_by staff user.
--   2. smart_list_shares table: which staff users a list is shared
--      with (owner always sees it; a list with no share rows but
--      shared_all=1 is visible to every user).
--
--  How to run (idempotent):
--    E:\xampp\mysql\bin\mysql.exe -u root < sql\smart_lists.sql
-- ============================================================

USE evee_crm;

CREATE TABLE IF NOT EXISTS smart_lists (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(190) NOT NULL,
  filters       LONGTEXT     DEFAULT NULL,
  sort_by       VARCHAR(100) DEFAULT NULL,
  fields        LONGTEXT     DEFAULT NULL,
  members       LONGTEXT     DEFAULT NULL,
  dealer_id     INT UNSIGNED DEFAULT NULL,
  shared_all    TINYINT(1)   NOT NULL DEFAULT 0,
  created_by    INT UNSIGNED NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_sl_name_owner (created_by, name),
  KEY idx_sl_created_by (created_by),
  KEY idx_sl_dealer (dealer_id),
  KEY idx_sl_shared_all (shared_all)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS smart_list_shares (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  smart_list_id  INT UNSIGNED NOT NULL,
  user_id        INT UNSIGNED NOT NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_sls_list_user (smart_list_id, user_id),
  KEY idx_sls_user (user_id),
  CONSTRAINT fk_sls_list FOREIGN KEY (smart_list_id)
    REFERENCES smart_lists(id) ON DELETE CASCADE,
  CONSTRAINT fk_sls_user FOREIGN KEY (user_id)
    REFERENCES staff_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
