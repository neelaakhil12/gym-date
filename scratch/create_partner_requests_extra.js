const { Pool } = require("pg");
require("dotenv").config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  console.log("Creating partner_requests_extra table...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS partner_requests_extra (
      request_id VARCHAR(255) PRIMARY KEY,
      status VARCHAR(50) DEFAULT 'pending',
      referred_by VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("Table partner_requests_extra created successfully!");

  // Insert or update record for Foreign gym (request_id 'c4ecc85b-43e7-448f-88a8-b8ed35bb44a9')
  await pool.query(`
    INSERT INTO partner_requests_extra (request_id, status, referred_by, updated_at)
    VALUES ('c4ecc85b-43e7-448f-88a8-b8ed35bb44a9', 'approved', '1FD76DC3', CURRENT_TIMESTAMP)
    ON CONFLICT (request_id) 
    DO UPDATE SET status = 'approved', referred_by = '1FD76DC3', updated_at = CURRENT_TIMESTAMP
  `);
  console.log("Inserted extra record for Foreign gym lead with ref 1FD76DC3");

  const rows = await pool.query("SELECT * FROM partner_requests_extra");
  console.log("Current partner_requests_extra:", rows.rows);

  await pool.end();
}

main().catch(console.error);
