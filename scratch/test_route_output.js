const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function main() {
  try {
    const email = 'neelaakhilkumar50@gmail.com';
    const uRes = await pool.query(
      "SELECT id, role_id, full_name, email FROM users WHERE LOWER(email) = $1 UNION SELECT id, 'partner' as role_id, full_name, email FROM partner_users WHERE LOWER(email) = $1 LIMIT 1",
      [email.toLowerCase()]
    );
    const partnerUser = uRes.rows[0];
    console.log("PARTNER USER:", partnerUser);

    const gymRes = await pool.query("SELECT * FROM gyms WHERE partner_id::text = $1::text LIMIT 1", [partnerUser.id]);
    const gym = gymRes.rows[0];
    console.log("GYM:", gym);

    const bookingsRes = await pool.query("SELECT amount FROM bookings WHERE gym_id::text = $1::text", [gym.id]);
    console.log("BOOKINGS COUNT:", bookingsRes.rows.length);

    const pRes = await pool.query(
      "SELECT * FROM payout_requests WHERE gym_id::text = $1::text AND (payout_type = 'revenue' OR payout_type IS NULL) ORDER BY created_at DESC",
      [gym.id]
    );
    console.log("REVENUE PAYOUTS:", pRes.rows);

  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    await pool.end();
  }
}

main();
