const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function main() {
  try {
    // Clean up duplicate debit entries in referral_transactions that belong to partners (since payout_requests tracks partner withdrawals)
    const delRes = await pool.query(`
      DELETE FROM referral_transactions 
      WHERE (type = 'debit' OR status = 'debited') 
      AND referrer_id::text IN (SELECT partner_id::text FROM gyms WHERE partner_id IS NOT NULL)
    `);
    console.log(`CLEANED UP ${delRes.rowCount} duplicate debit entries from referral_transactions.`);
  } catch (err) {
    console.error("CLEANUP ERROR:", err);
  } finally {
    await pool.end();
  }
}

main();
