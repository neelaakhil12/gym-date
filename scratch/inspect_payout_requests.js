const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function main() {
  try {
    const res = await pool.query(`
      SELECT id, gym_id, amount, payout_method, payout_type, qr_code_url, payment_proof_url, status, created_at
      FROM payout_requests
      ORDER BY created_at DESC
      LIMIT 10
    `);
    console.log("RECENT PAYOUT REQUESTS:", JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error("DB ERROR:", err);
  } finally {
    await pool.end();
  }
}

main();
