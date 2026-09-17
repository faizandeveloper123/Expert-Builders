INSERT INTO staff_users (first_name, last_name, full_name, email, user_type, restrict_data, password, password_plain, approved)
VALUES ('Admin', 'Expert Builders', 'Admin Expert Builders', 'expertdevelopers@gmail.com', 'Admin', 0,
'$2y$10$NSErJlyuCdtFvjSZ2JRhre1Kgu3jAAtSCxZCqu0sAH/0inOSP/lu.',
'Expertbuilders@2026', 1)
ON DUPLICATE KEY UPDATE
  password='$2y$10$NSErJlyuCdtFvjSZ2JRhre1Kgu3jAAtSCxZCqu0sAH/0inOSP/lu.',
  password_plain='Expertbuilders@2026',
  approved=1,
  user_type='Admin',
  first_name='Admin',
  last_name='Expert Builders',
  full_name='Admin Expert Builders';
