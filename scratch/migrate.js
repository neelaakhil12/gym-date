const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  try {
    console.log("Reading .env file...");
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Simple regex to find DATABASE_URL
    const match = envContent.match(/DATABASE_URL=["']?(.+?)["']?(\s|$)/);
    if (!match) {
      throw new Error("Could not find DATABASE_URL in .env file.");
    }
    
    const connectionString = match[1].trim();
    console.log("Found connection string. Connecting...");
    
    const client = new Client({ connectionString });
    await client.connect();
    
    console.log("Connected! Running migration...");
    
    // 1. Add commission_rate to gyms
    await client.query("ALTER TABLE gyms ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 10");
    console.log("Checked commission_rate column.");

    // 2. Add partner_referral_amount to gyms
    await client.query("ALTER TABLE gyms ADD COLUMN IF NOT EXISTS partner_referral_amount NUMERIC DEFAULT 100");
    console.log("Checked partner_referral_amount column.");

    // 3. Create platform_config table
    await client.query("CREATE TABLE IF NOT EXISTS platform_config (key TEXT PRIMARY KEY, value TEXT, description TEXT)");
    console.log("Checked platform_config table.");

    // 4. Seed platform_commission if missing
    await client.query("INSERT INTO platform_config (key, value, description) VALUES ('platform_commission', '10', 'Global default commission percentage.') ON CONFLICT (key) DO NOTHING");
    console.log("Seeded platform_commission.");

    await client.end();
    console.log("Migration SUCCESSFUL!");
    process.exit(0);
  } catch (err) {
    console.error("Migration FAILED:", err.message);
    process.exit(1);
  }
}

migrate();
