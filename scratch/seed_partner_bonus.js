const { Pool } = require('pg');

const connectionString = "postgresql://gymdate_user:GymDate@DB2024!@localhost:5432/gymdate_db";
const pool = new Pool({ connectionString });

async function seed() {
  try {
    console.log("Checking for partner_referral_bonus...");
    const res = await pool.query("SELECT * FROM platform_config WHERE key = 'partner_referral_bonus'");
    
    if (res.rows.length === 0) {
      console.log("Adding partner_referral_bonus...");
      await pool.query(
        "INSERT INTO platform_config (key, value, description) VALUES ($1, $2, $3)",
        ['partner_referral_bonus', '100', 'Bonus given to partners when their referral signs up']
      );
      console.log("Successfully added partner_referral_bonus.");
    // Signup Bonus
    const signupRes = await pool.query("SELECT * FROM platform_config WHERE key = 'signup_bonus'");
    if (signupRes.rows.length === 0) {
      await pool.query(
        "INSERT INTO platform_config (key, value, description) VALUES ($1, $2, $3)",
        ['signup_bonus', '10', 'Initial bonus given to new users on signup']
      );
      console.log("Added signup_bonus.");
    }
  } catch (err) {
    console.error("Error seeding config:", err);
  } finally {
    await pool.end();
  }
}

seed();
