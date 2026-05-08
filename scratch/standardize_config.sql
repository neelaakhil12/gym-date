-- Standardize platform_config keys
-- 1. Create table if not exists (though it should exist)
CREATE TABLE IF NOT EXISTS public.platform_config (
  key VARCHAR(100) PRIMARY KEY,
  value VARCHAR(255) NOT NULL,
  description TEXT
);

-- 2. Migrate user referral bonus
INSERT INTO platform_config (key, value, description)
SELECT 'user_referral_bonus', value, 'Amount given to a user when they refer a friend'
FROM platform_config WHERE key = 'refer_a_friend'
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 3. Migrate partner referral bonus
INSERT INTO platform_config (key, value, description)
SELECT 'partner_referral_bonus', value, 'Amount given to a partner when they refer another gym owner'
FROM platform_config WHERE key = 'referral_bonus_partner'
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 4. Set defaults if they don't exist yet
INSERT INTO platform_config (key, value, description)
VALUES 
  ('user_referral_bonus', '30', 'Amount given to a user when they refer a friend'),
  ('partner_referral_bonus', '100', 'Amount given to a partner when they refer another gym owner'),
  ('max_wallet_per_txn', '10', 'Maximum amount from wallet usable per transaction'),
  ('signup_bonus', '0', 'Bonus given to new users upon signup')
ON CONFLICT (key) DO NOTHING;

-- 5. Cleanup old keys (optional but good for consistency)
DELETE FROM platform_config WHERE key IN ('refer_a_friend', 'referral_bonus_partner');
