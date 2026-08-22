const { Pool } = require("pg");
require("dotenv").config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const cols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'partner_requests'
  `);
  console.log("Columns on partner_requests:", cols.rows);

  // Add missing columns
  await pool.query(`
    ALTER TABLE partner_requests 
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS referred_by TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  `);
  console.log("Added missing columns to partner_requests");

  // Fix the Foreign gym record to link to 1FD76DC3
  await pool.query(`
    UPDATE partner_requests 
    SET referred_by = '1FD76DC3' 
    WHERE email = 'akhilneela95@gmail.com'
  `);
  console.log("Updated Foreign gym lead with referred_by = 1FD76DC3");

  await pool.end();
}

main().catch(console.error);
