const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkLeads() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
  });

  try {
    console.log("--- DATABASE CONNECTION ---");
    console.log("Connecting to:", process.env.DATABASE_URL ? "URL defined" : "URL MISSING!");
    
    const res = await pool.query("SELECT * FROM partner_requests ORDER BY created_at DESC");
    
    if (res.rows.length === 0) {
      console.log("\n!!! RESULT: The table 'partner_requests' is EMPTY. No leads found. !!!");
    } else {
      console.log(`\nSUCCESS: Found ${res.rows.length} leads:`);
      console.table(res.rows);
    }

  } catch (err) {
    console.error("\n--- ERROR ---");
    console.error(err.message);
    if (err.message.includes("does not exist")) {
      console.log("SUGGESTION: The table 'partner_requests' hasn't been created yet.");
    }
  } finally {
    await pool.end();
  }
}

checkLeads();
