-- ============================================================
--  EVEE CRM - Dealer Lead BUCKETS (v3)
--  XAMPP MySQL (MariaDB 10.4+)
--
--  Replaces the 7-stage pipeline with 5 simple buckets a dealer
--  drags / moves each lead into as they work it:
--
--    non_contacted  -> dealer has not contacted the lead yet
--    contacted      -> dealer contacted the lead (call/mail/sms/whatsapp)
--    closed         -> lead gave a date, will talk / contact later
--    customer       -> lead BOUGHT the bike (success)
--    rejected       -> lead refused, not buying
--
--  Mapping from the old stage enum:
--    assigned    -> non_contacted
--    contacted   -> contacted
--    interested  -> contacted      (positive contact)
--    negotiating -> contacted      (still in conversation)
--    follow_up   -> closed         (will talk later)
--    rejected    -> rejected
--    sold        -> customer       (bought)
--
--  How to run (idempotent):
--    E:\xampp\mysql\bin\mysql.exe -u root < sql\dealer_dashboard_buckets.sql
-- ============================================================

USE evee_crm;

UPDATE dealer_lead_status
   SET status = CASE status
                  WHEN 'assigned'    THEN 'non_contacted'
                  WHEN 'interested'  THEN 'contacted'
                  WHEN 'negotiating' THEN 'contacted'
                  WHEN 'follow_up'   THEN 'closed'
                  WHEN 'sold'        THEN 'customer'
                  ELSE status
                END;

ALTER TABLE dealer_lead_status
  MODIFY COLUMN status ENUM(
    'non_contacted',
    'contacted',
    'closed',
    'customer',
    'rejected'
  ) NOT NULL DEFAULT 'non_contacted';