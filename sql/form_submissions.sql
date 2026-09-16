-- ============================================================
--  EVEE CRM - Form submission data on leads
--  Run AFTER contacts_extended.sql (custom_fields column)
--    C:\xampp\mysql\bin\mysql.exe -u root < sql\form_submissions.sql
--
--  Stored under custom_fields.form_submissions so the lead detail
--  "Form | <name>" accordions and the Manage Fields form columns
--  show exactly what was filled in on each form.
-- ============================================================
USE evee_crm;

-- Muhammad Faizan -> submitted the Auto Dealer Contact Us form
UPDATE contacts SET custom_fields = JSON_OBJECT(
  'form_submissions', JSON_ARRAY(
    JSON_OBJECT(
      'formName', 'Auto Dealer Contact Us',
      'submittedOn', '2026-08-10 11:24:00',
      'values', JSON_OBJECT(
        'Full Name', 'Muhammad Faizan',
        'Phone', '0371 1520951',
        'Email', 'faizan@gmail.com',
        'Preferred Contact Method', 'Call',
        'Are you looking for', 'New Car',
        'Preferred Features (check all that apply)', 'Sunroof, Navigation',
        'I Consent to Receive SMS Notifications', 'I Consent to Receive SMS Notifications'
      )
    )
  )
) WHERE id = 1;

-- Tahira Abbas -> submitted the "Form 0" lead form
UPDATE contacts SET custom_fields = JSON_OBJECT(
  'form_submissions', JSON_ARRAY(
    JSON_OBJECT(
      'formName', 'Form 0',
      'submittedOn', '2026-08-10 09:12:00',
      'values', JSON_OBJECT(
        'First Name', 'Tahira',
        'Last Name', 'Abbas',
        'Phone', '0371 1520051',
        'Email', 'orixzylum@gmail.com'
      )
    )
  )
) WHERE id = 2;

-- (Example) Riley Bennett -> warm lead via the Auto Dealer form
UPDATE contacts SET custom_fields = JSON_OBJECT(
  'form_submissions', JSON_ARRAY(
    JSON_OBJECT(
      'formName', 'Auto Dealer Contact Us',
      'submittedOn', '2026-08-09 18:41:00',
      'values', JSON_OBJECT(
        'Full Name', 'Riley Bennett',
        'Phone', '+13141236547',
        'Email', 'riley.bennett@corpor...',
        'Preferred Contact Method', 'SMS',
        'Are you looking for', 'Service',
        'Preferred Features (check all that apply)', 'Backup Camera',
        'I Consent to Receive SMS Notifications', 'I Consent to Receive SMS Notifications'
      )
    )
  )
) WHERE id = 7;