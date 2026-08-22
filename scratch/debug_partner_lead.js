const { Pool } = require("pg");
require("dotenv").config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  console.log("=== PARTNER REQUESTS ===");
  const reqs = await pool.query("SELECT * FROM partner_requests ORDER BY created_at DESC LIMIT 5");
  console.log(reqs.rows);

  console.log("\n=== USERS EXTRA ===");
  const ue = await pool.query("SELECT * FROM users_extra LIMIT 10");
  console.log(ue.rows);

  console.log("\n=== PARTNER USERS / GYMS ===");
  const gyms = await pool.query("SELECT g.id, g.name, g.partner_id, u.email as partner_email FROM gyms g LEFT JOIN users u ON g.partner_id::text = u.id::text");
  console.log(gyms.rows);

  await pool.end();
}

main().catch(console.error);
