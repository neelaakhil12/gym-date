const { Pool } = require("pg");
require("dotenv").config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const res = await pool.query("SELECT * FROM referral_transactions ORDER BY created_at DESC LIMIT 15");
  console.log(res.rows);
  await pool.end();
}

main().catch(console.error);
