const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function main() {
  try {
    const bookingCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'bookings'");
    console.log("BOOKING COLUMNS:", bookingCols.rows.map(r => r.column_name));

    const payoutCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'payout_requests'");
    console.log("PAYOUT COLUMNS:", payoutCols.rows.map(r => r.column_name));

    console.log("\n=== ALL BOOKINGS FOR NATIONAL (a66bdb3d-cc49-45f6-a547-5df796a51db7) ===");
    const natBookings = await pool.query("SELECT * FROM bookings WHERE gym_id = 'a66bdb3d-cc49-45f6-a547-5df796a51db7'");
    console.log(natBookings.rows);

    console.log("\n=== ALL BOOKINGS FOR CULTFIT (16ae957c-1bd2-450c-85b7-411991dbe41b) ===");
    const cultBookings = await pool.query("SELECT * FROM bookings WHERE gym_id = '16ae957c-1bd2-450c-85b7-411991dbe41b'");
    console.log(cultBookings.rows);

    console.log("\n=== ALL PAYOUT REQUESTS ===");
    const payouts = await pool.query("SELECT * FROM payout_requests ORDER BY created_at DESC");
    console.log(payouts.rows);

  } catch (err) {
    console.error("DB ERROR:", err);
  } finally {
    await pool.end();
  }
}

main();
