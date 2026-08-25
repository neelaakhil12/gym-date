const { Pool } = require('pg');
require('dotenv').config({ path: '/var/www/gymdate/.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function debug() {
  const email = 'sushmasamadam8@gmail.com';
  console.log("1. Finding user...");
  let userRes = await pool.query("SELECT id, email, full_name FROM partner_users WHERE LOWER(email) = $1", [email]);
  if (userRes.rows.length === 0) {
    userRes = await pool.query("SELECT id, email, full_name FROM users WHERE LOWER(email) = $1", [email]);
  }
  const partnerUser = userRes.rows[0];
  console.log("partnerUser:", partnerUser);

  console.log("2. Finding gym...");
  try {
    const gymRes = await pool.query(`
      SELECT g.* FROM gyms g
      WHERE g.partner_id::text = $1::text 
         OR g.partner_id::text IN (
           SELECT id::text FROM users WHERE LOWER(email) = $2
           UNION
           SELECT id::text FROM partner_users WHERE LOWER(email) = $2
         )
      LIMIT 1
    `, [partnerUser?.id || '', email]);
    console.log("gym:", gymRes.rows[0]);
    const gym = gymRes.rows[0];

    console.log("3. Extra config...");
    const extraRes = await pool.query("SELECT * FROM gyms_extra WHERE gym_id::text = $1::text", [gym.id]);
    console.log("extra:", extraRes.rows);

    console.log("4. Bookings...");
    const bRes = await pool.query(`
      SELECT b.*, COALESCE(u.full_name, 'Member') as customer_name, COALESCE(u.email, 'No email') as customer_email
      FROM bookings b
      LEFT JOIN users u ON b.user_id::text = u.id::text
      WHERE b.gym_id::text = $1::text
      ORDER BY b.created_at DESC
    `, [gym.id]);
    console.log("bookings count:", bRes.rows.length);

    console.log("5. Payouts...");
    const payRes = await pool.query("SELECT COALESCE(SUM(amount), 0) as pending FROM payout_requests WHERE gym_id::text = $1::text AND status = 'pending'", [gym.id]);
    console.log("pending:", payRes.rows[0]);
  } catch (err) {
    console.error("DEBUG ERROR:", err);
  }

  await pool.end();
}

debug();
