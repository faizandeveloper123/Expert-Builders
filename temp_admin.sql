INSERT INTO staff_users (first_name, last_name, full_name, email, user_type, restrict_data, password, password_plain, approved)
VALUES ('Admin', 'Yadea', 'Admin Yadea', 'yadeapakistan@gmail.com', 'Admin', 0,
'$2y$10$URm5iw8DRJUIFUwRZwPZtusio5Gvz5gnAvEiKDOjuYsCAhwUWHxny',
'FWAER@#$R', 1)
ON DUPLICATE KEY UPDATE
  password='$2y$10$URm5iw8DRJUIFUwRZwPZtusio5Gvz5gnAvEiKDOjuYsCAhwUWHxny',
  password_plain='FWAER@#$R',
  approved=1,
  user_type='Admin',
  first_name='Admin',
  last_name='Yadea',
  full_name='Admin Yadea';
