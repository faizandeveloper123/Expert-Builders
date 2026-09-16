-- ============================================================
--  EVEE CRM - Seed data (matches the original UI mock rows)
--  Run AFTER schema.sql
--    C:\xampp\mysql\bin\mysql.exe -u root < sql\seed.sql
-- ============================================================
USE evee_crm;

-- Contacts (is_lead=1 for anything tagged *lead*)
-- NOTE: use NULL (not '') for empty phone/email so the UNIQUE keys allow multiple rows
INSERT INTO contacts
  (id, first_name, last_name, full_name, phone, email, business_name,
   contact_type, is_lead, avatar_color, created_at, last_activity_at)
VALUES
  (1, 'Muhammad', 'Faizan', 'Muhammad Faizan', '0371 1520951', 'faizan@gmail.com', 'Evee',
   'Lead', 1, 'bg-emerald-200 text-emerald-800', '2026-08-08 15:50:00', NULL),
  (2, 'Tahira', 'Abbas', 'Tahira Abbas', '0371 1520051', 'orixzylum@gmail.com', NULL,
   '', 0, 'bg-sky-200 text-sky-800', '2026-08-08 14:06:00', NULL),
  (3, '(Example) Casey', 'Mo...', '(Example) Casey Mo...', '+16541234567', NULL, '(Example) Dunder Miff...',
   '', 0, 'bg-purple-200 text-purple-800', '2026-08-08 13:32:00', NULL),
  (4, '(Example) Taylor', 'Re...', '(Example) Taylor Re...', '+178655689546', NULL, "(Example) MacLaren's...",
   '', 0, 'bg-sky-200 text-sky-800', '2026-08-08 13:32:00', NULL),
  (5, '(Example) Jordan', 'S...', '(Example) Jordan S...', NULL, 'jordan.smith@exampl...', "(Example) MacLaren's...",
   '', 0, 'bg-blue-200 text-blue-800', '2026-08-08 13:32:00', NULL),
  (6, '(Example) Alex', 'Doe ...', '(Example) Alex Doe ...', NULL, 'alex.carter@business...', '(Example) Goliath Nati...',
   '', 0, 'bg-indigo-200 text-indigo-800', '2026-08-08 13:31:00', NULL),
  (7, '(Example) Riley', 'Ben...', '(Example) Riley Ben...', '+13141236547', 'riley.bennett@corpor...', '(Example) Goliath Nati...',
   'Lead', 1, 'bg-emerald-200 text-emerald-800', '2026-08-08 13:31:00', NULL);

-- Tag assignments (tag ids: 1=warm lead, 2=hot lead, 3=cold lead, 4=follow-up, 5=customer)
INSERT INTO contact_tags (contact_id, tag_id) VALUES
  (1, 1), -- Muhammad Faizan -> warm lead
  (3, 4), -- Casey -> follow-up
  (3, 5), -- Casey -> customer  (the "+1" overflow tag)
  (4, 4), -- Taylor -> follow-up
  (5, 4), -- Jordan -> follow-up
  (6, 4), -- Alex -> follow-up
  (7, 1), -- Riley -> warm lead
  (7, 5); -- Riley -> customer (the "+1" overflow tag)
