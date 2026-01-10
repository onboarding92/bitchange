-- Create Admin User
-- Email: Admin@bitchangemoney.xyz
-- Password: AdminBitChange2025

INSERT INTO users (
  email, 
  password, 
  name, 
  role, 
  emailVerified, 
  kycStatus, 
  kycApprovedAt,
  accountStatus,
  loginMethod,
  twoFactorEnabled,
  createdAt,
  updatedAt,
  lastSignedIn
) VALUES (
  'Admin@bitchangemoney.xyz',
  '$2b$10$7xiT9ybeLvWT3B25VaV0H.udWEXS9Ja8603txrQwF9XKi6kNwIgGy',
  'Administrator',
  'admin',
  NOW(),
  'approved',
  NOW(),
  'active',
  'email',
  0,
  NOW(),
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE 
  role = 'admin',
  kycStatus = 'approved',
  kycApprovedAt = NOW();

SELECT 'Admin user created/updated successfully!' as Status;
SELECT id, email, name, role, kycStatus FROM users WHERE email = 'Admin@bitchangemoney.xyz';
