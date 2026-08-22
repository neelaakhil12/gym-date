const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function main() {
  try {
    await pool.query(`
      ALTER TABLE payout_requests ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
    `);
    console.log("SUCCESS: payment_proof_url column added to payout_requests table!");
  } catch (err) {
    console.error("MIGRATION ERROR:", err);
  } finally {
    await pool.end();
  }
}

main();
