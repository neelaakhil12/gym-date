-- Step 1: Find the user in auth.users to get their UUID
-- Run this first to confirm the account exists
SELECT id, email FROM auth.users WHERE email = 'santoedgepvtltd@gmail.com';

-- Step 2: Upsert the super_admin role in profiles table
-- Replace <UUID> with the id returned from Step 1 (or use subquery below)
UPDATE profiles
SET role_id = 'super_admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'santoedgepvtltd@gmail.com');

-- Step 3: If no row exists in profiles yet, insert one
INSERT INTO profiles (id, email, role_id)
SELECT id, email, 'super_admin'
FROM auth.users
WHERE email = 'santoedgepvtltd@gmail.com'
ON CONFLICT (id) DO UPDATE SET role_id = 'super_admin';

-- Step 4: Verify the result
SELECT p.id, p.email, p.role_id
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'santoedgepvtltd@gmail.com';
