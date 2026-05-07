INSERT INTO platform_config (key, value, description) 
VALUES 
('referral_milestone_count', '5', 'Number of referrals needed to trigger the milestone bonus'), 
('referral_milestone_bonus', '100', 'Extra bonus amount given when the milestone is reached')
ON CONFLICT (key) DO UPDATE SET description = EXCLUDED.description;
