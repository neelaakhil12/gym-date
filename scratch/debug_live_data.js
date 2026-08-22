const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function check() {
  try {
    const userRes = await pool.query("SELECT id, email, full_name FROM users WHERE email = 'neelaakhilharish@gmail.com'");
    if (userRes.rows.length === 0) return;
    const user = userRes.rows[0];

    const extraRes = await pool.query("SELECT * FROM users_extra WHERE user_id = $1", [user.id]);
    console.log("=== USER EXTRA ===");
    console.table(extraRes.rows);

    const txns = await pool.query(`
      SELECT rt.id, rt.referrer_id, rt.referred_user_email, rt.type, rt.amount, rt.status, rt.created_at, u.full_name as referee_name
      FROM referral_transactions rt
      LEFT JOIN users u ON LOWER(rt.referred_user_email) = LOWER(u.email)
      WHERE rt.referrer_id = $1
      ORDER BY rt.created_at DESC
    `, [user.id]);
    console.log("=== REFERRAL TRANSACTIONS ===");
    console.table(txns.rows);

    const referredUsers = await pool.query(`
      SELECT u.id, u.email, u.full_name, ue.referred_by, ue.created_at, u.created_at as user_created_at
      FROM users u
      JOIN users_extra ue ON u.id = ue.user_id
      WHERE ue.referred_by = $1
    `, [extraRes.rows[0]?.referral_code || '85FC345D']);
    console.log("=== USERS WITH REFERRED_BY ===");
    console.table(referredUsers.rows);

  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    pool.end();
  }
}

check();
