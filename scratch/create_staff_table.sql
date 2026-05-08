-- Create staff_users table for Operations Staff
CREATE TABLE IF NOT EXISTS staff_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Migrate existing operations staff if any were stuck in users table
-- INSERT INTO staff_users (id, email, full_name, password_hash, created_at)
-- SELECT id::uuid, email, full_name, password_hash, created_at FROM users WHERE role_id = 'operation_admin'
-- ON CONFLICT (email) DO NOTHING;
