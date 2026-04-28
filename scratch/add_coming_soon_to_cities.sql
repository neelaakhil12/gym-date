-- Run this in Supabase SQL Editor
ALTER TABLE cities ADD COLUMN IF NOT EXISTS is_coming_soon BOOLEAN DEFAULT FALSE;
