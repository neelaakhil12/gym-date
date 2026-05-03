import { query } from "./src/lib/db";

async function check() {
  try {
    const users = await query("SELECT * FROM users");
    console.log("TOTAL USERS:", users.rows.length);
    console.log("USER ROLES:", [...new Set(users.rows.map(u => u.role_id))]);
    
    const bookings = await query("SELECT * FROM bookings");
    console.log("TOTAL BOOKINGS:", bookings.rows.length);
    
    const gyms = await query("SELECT * FROM gyms");
    console.log("TOTAL GYMS:", gyms.rows.length);
  } catch (e) {
    console.error("CHECK ERROR:", e);
  }
}

check();
