ALTER TABLE payout_requests 
ADD COLUMN IF NOT EXISTS payout_type VARCHAR(20) DEFAULT 'revenue';
