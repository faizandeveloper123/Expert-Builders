-- ============================================================
--  EVEE CRM - Dealer Lead STAGE Pipeline (v2)
--  XAMPP MySQL (MariaDB 10.4+)
--
--  Replaces the simple status enum with a full stage pipeline so
--  a dealer can show exactly where a lead stands:
--
--    assigned     -> assigned to dealer, not yet contacted
--    contacted    -> dealer contacted the lead (via call/mail/sms/whatsapp)
--    interested   -> lead responded positively / wants details
--    negotiating  -> discussing price / finance / offer
--    follow_up    -> lead asked to be contacted later (delayed)
--    rejected     -> lead not interested
--    sold         -> lead bought the vehicle (success)
--
--  How to run (idempotent):
--    E:\xampp\mysql\bin\mysql.exe -u root < sql\dealer_dashboard_stages.sql
-- ============================================================

USE evee_crm;

-- Map old statuses onto the new pipeline before changing the enum.
UPDATE dealer_lead_status
   SET status = CASE status
                  WHEN 'responded'    THEN 'interested'
                  WHEN 'no_response'  THEN 'follow_up'
                  WHEN 'closed'       THEN 'sold'
                  ELSE status
                END;

ALTER TABLE dealer_lead_status
  MODIFY COLUMN status ENUM(
    'assigned',
    'contacted',
    'interested',
    'negotiating',
    'follow_up',
    'rejected',
    'sold'
  ) NOT NULL DEFAULT 'assigned';