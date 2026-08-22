const { Pool } = require("pg");
require("dotenv").config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const res = await pool.query(`
    SELECT pr.id, pr.gym_name, pr.created_at, COALESCE(pre.status, 'pending') as status 
    FROM partner_requests pr 
    LEFT JOIN partner_requests_extra pre ON pr.id::text = pre.request_id::text
  `);
  console.log("Partner requests status:", res.rows);
  await pool.end();
}

main().catch(console.error);
