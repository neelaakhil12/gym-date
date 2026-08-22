const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function main() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payout_requests (
        id VARCHAR(50) PRIMARY KEY,
        gym_id VARCHAR(50) REFERENCES gyms(id),
        amount NUMERIC NOT NULL,
        payout_method VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        bank_name VARCHAR(100),
        account_holder VARCHAR(100),
        account_number VARCHAR(50),
        ifsc_code VARCHAR(20),
        upi_id VARCHAR(100),
        mobile_number VARCHAR(20),
        qr_code_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE payout_requests ADD COLUMN IF NOT EXISTS payout_type VARCHAR(50) DEFAULT 'revenue';
    `);
    console.log("SUCCESS: payout_requests table and payout_type column verified!");
  } catch (err) {
    console.error("MIGRATION ERROR:", err);
  } finally {
    await pool.end();
  }
}

main();
