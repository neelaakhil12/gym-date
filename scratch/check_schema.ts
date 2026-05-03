import { query } from "./src/lib/db";

async function check() {
  try {
    const res = await query("SELECT * FROM information_schema.columns WHERE table_name = 'gyms'");
    console.log("GYMS COLUMNS:", res.rows.map(r => r.column_name));
    
    const users = await query("SELECT * FROM users LIMIT 5");
    console.log("USERS SAMPLE:", users.rows);
  } catch (e) {
    console.error("CHECK ERROR:", e);
  }
}

check();
