
import { query } from "./src/lib/db";

async function checkTable() {
  try {
    const res = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'password_resets'
      );
    `);
    console.log("Table password_resets exists:", res.rows[0].exists);
    
    if (!res.rows[0].exists) {
      console.log("Creating password_resets table...");
      await query(`
        CREATE TABLE IF NOT EXISTS password_resets (
          email VARCHAR NOT NULL,
          token VARCHAR NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          PRIMARY KEY (email, token)
        );
      `);
      console.log("Table created successfully.");
    }
  } catch (err) {
    console.error("Error checking/creating table:", err);
  }
}

checkTable();
