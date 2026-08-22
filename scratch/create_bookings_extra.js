const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function check() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings_extra (
        booking_id VARCHAR(255) PRIMARY KEY,
        ticket_code VARCHAR(50),
        qr_code TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Successfully created bookings_extra table");

    const cols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'bookings_extra'
    `);
    console.table(cols.rows);
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    pool.end();
  }
}

check();
