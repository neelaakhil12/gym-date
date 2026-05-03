-- ============================================================
-- GymDate: Separate Auth Tables Migration
-- Run this on your Hostinger PostgreSQL database
-- ============================================================

-- 1. Create admin_users table (Super Admins only)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create partner_users table (Gym Partners only)
CREATE TABLE IF NOT EXISTS partner_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(20),
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Migrate existing super_admin records from users → admin_users
INSERT INTO admin_users (id, email, full_name, password_hash, created_at)
SELECT
  id::uuid,
  email,
  full_name,
  password_hash,
  COALESCE(created_at, CURRENT_TIMESTAMP)
FROM users
WHERE role_id = 'super_admin'
ON CONFLICT (email) DO UPDATE
  SET full_name     = EXCLUDED.full_name,
      password_hash = EXCLUDED.password_hash;

-- 4. Migrate existing partner records from users → partner_users
INSERT INTO partner_users (id, email, full_name, phone, password_hash, created_at)
SELECT
  id::uuid,
  email,
  full_name,
  phone,
  password_hash,
  COALESCE(created_at, CURRENT_TIMESTAMP)
FROM users
WHERE role_id = 'partner'
ON CONFLICT (email) DO UPDATE
  SET full_name     = EXCLUDED.full_name,
      phone         = EXCLUDED.phone,
      password_hash = EXCLUDED.password_hash;

-- 5. The users table now serves CUSTOMERS ONLY
--    (role_id = 'user'). Keep existing data — no deletion needed.
--    Partners and admins are now in their own tables.

-- 6. Verify migration
SELECT 'admin_users'   AS table_name, COUNT(*) FROM admin_users
UNION ALL
SELECT 'partner_users' AS table_name, COUNT(*) FROM partner_users
UNION ALL
SELECT 'users (customers)' AS table_name, COUNT(*) FROM users WHERE role_id = 'user'
UNION ALL
SELECT 'users (all roles)'  AS table_name, COUNT(*) FROM users;
