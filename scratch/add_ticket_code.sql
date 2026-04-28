-- Add ticket_code column to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS ticket_code TEXT UNIQUE;

-- Generate ticket_codes for existing bookings if any (simple random string)
UPDATE bookings 
SET ticket_code = 'GD-' || upper(substring(id::text from 1 for 6))
WHERE ticket_code IS NULL;
