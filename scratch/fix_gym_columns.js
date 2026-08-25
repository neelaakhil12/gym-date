const { Pool } = require('pg');
require('dotenv').config({ path: '/var/www/gymdate/.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fixGymsColumns() {
  const cols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'gyms'
  `);
  console.log("Current gyms columns:", cols.rows);

  await pool.query(`
    ALTER TABLE gyms ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
    ALTER TABLE gyms ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
    ALTER TABLE gyms ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 4.5;
    ALTER TABLE gyms ADD COLUMN IF NOT EXISTS reviews INTEGER DEFAULT 0;
    ALTER TABLE gyms ADD COLUMN IF NOT EXISTS has_offer BOOLEAN DEFAULT FALSE;
    ALTER TABLE gyms ADD COLUMN IF NOT EXISTS offer_percentage NUMERIC DEFAULT 0;
    ALTER TABLE gyms ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 10;
    ALTER TABLE gyms ADD COLUMN IF NOT EXISTS partner_referral_amount NUMERIC DEFAULT 100;
    ALTER TABLE gyms ADD COLUMN IF NOT EXISTS gallery TEXT[] DEFAULT '{}';
    ALTER TABLE gyms ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}';
  `);
  console.log("Added missing columns to gyms successfully!");

  await pool.end();
}

fixGymsColumns();
