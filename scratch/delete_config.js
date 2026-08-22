const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await pool.query("DELETE FROM platform_config WHERE key IN ('refer_a_friend', 'user_referral_bonus')");
    console.log("Deleted refer_a_friend and user_referral_bonus from platform_config");

    const res = await pool.query("SELECT * FROM platform_config");
    console.table(res.rows);
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    pool.end();
  }
}

run();
