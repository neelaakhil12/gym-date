const { query } = require('./src/lib/db');

async function migrate() {
  try {
    console.log("Starting migration...");
    
    // 1. Add commission_rate to gyms
    await query("ALTER TABLE gyms ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 10");
    console.log("Checked commission_rate column.");

    // 2. Add partner_referral_amount to gyms
    await query("ALTER TABLE gyms ADD COLUMN IF NOT EXISTS partner_referral_amount NUMERIC DEFAULT 100");
    console.log("Checked partner_referral_amount column.");

    // 3. Create platform_config table
    await query("CREATE TABLE IF NOT EXISTS platform_config (key TEXT PRIMARY KEY, value TEXT, description TEXT)");
    console.log("Checked platform_config table.");

    // 4. Seed platform_commission if missing
    await query("INSERT INTO platform_config (key, value, description) VALUES ('platform_commission', '10', 'Global default commission percentage.') ON CONFLICT (key) DO NOTHING");
    console.log("Seeded platform_commission.");

    console.log("Migration SUCCESSFUL!");
    process.exit(0);
  } catch (err) {
    console.error("Migration FAILED:", err);
    process.exit(1);
  }
}

migrate();
