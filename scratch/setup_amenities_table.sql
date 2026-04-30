-- Create amenities table
CREATE TABLE IF NOT EXISTS amenities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial default amenities
INSERT INTO amenities (name) VALUES 
('AC'), 
('Personal Trainer'), 
('Parking'), 
('Locker Room'), 
('WiFi'), 
('Supplements'), 
('Steam Room'), 
('Sauna'), 
('Yoga Mats'), 
('Zumba Classes'), 
('Shower'), 
('Crossfit Rig')
ON CONFLICT (name) DO NOTHING;
