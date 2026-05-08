const { query } = require('./src/lib/db');

async function updateTable() {
  try {
    console.log('Adding payout_type column to payout_requests...');
    await query(`
      ALTER TABLE payout_requests 
      ADD COLUMN IF NOT EXISTS payout_type VARCHAR(20) DEFAULT 'revenue'
    `);
    console.log('Success.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

updateTable();
