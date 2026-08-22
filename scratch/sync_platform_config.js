const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function check() {
  try {
    // Ensure user_referral_bonus exists in platform_config
    await pool.query(`
      INSERT INTO platform_config (key, value, description)
      VALUES ('user_referral_bonus', '10', 'Amount given to a user when they refer a friend')
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description
    `);

    const res = await pool.query("SELECT * FROM platform_config");
    console.table(res.rows);
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    pool.end();
  }
}

check();
