const { Pool } = require("pg");
require("dotenv").config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const leadEmail = 'akhilneela95@gmail.com';
  const refCode = '1FD76DC3';

  // 1. Find referrer
  const referrerRes = await pool.query(`
    SELECT u.id, u.email, u.full_name, ue.wallet_balance
    FROM users u
    JOIN users_extra ue ON u.id = ue.user_id
    WHERE TRIM(UPPER(ue.referral_code)) = $1
  `, [refCode]);

  if (referrerRes.rows.length === 0) {
    console.error("Referrer not found for code:", refCode);
    return;
  }

  const referrer = referrerRes.rows[0];
  console.log("Found Referrer:", referrer);

  // Check gym referral amount from gyms_extra or platform_config
  let bonusAmount = 100;
  try {
    const gymRes = await pool.query(`
      SELECT ge.partner_referral_amount 
      FROM gyms g 
      LEFT JOIN gyms_extra ge ON g.id = ge.gym_id 
      WHERE g.partner_id::text = $1::text LIMIT 1
    `, [referrer.id]);
    if (gymRes.rows.length > 0 && gymRes.rows[0].partner_referral_amount) {
      bonusAmount = parseFloat(gymRes.rows[0].partner_referral_amount);
    } else {
      const configRes = await pool.query("SELECT value FROM platform_config WHERE key = 'partner_referral_bonus' LIMIT 1");
      bonusAmount = parseFloat(configRes.rows[0]?.value || '100');
    }
  } catch (e) {
    console.warn("Using default config amount:", e.message);
  }

  console.log("Bonus Amount to Credit:", bonusAmount);

  // 2. Credit wallet_balance in users_extra
  await pool.query(`
    INSERT INTO users_extra (user_id, wallet_balance, updated_at)
    VALUES ($1, $2, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id) 
    DO UPDATE SET wallet_balance = COALESCE(users_extra.wallet_balance, 0) + $2, updated_at = CURRENT_TIMESTAMP
  `, [referrer.id, bonusAmount]);

  // Insert transaction
  await pool.query(
    "INSERT INTO referral_transactions (referrer_id, referred_user_email, type, amount, status) VALUES ($1, $2, 'partner', $3, 'credited')",
    [referrer.id, leadEmail.toLowerCase(), bonusAmount]
  );

  console.log(`Successfully credited ₹${bonusAmount} to ${referrer.email}!`);

  // Verify wallet balance
  const finalUe = await pool.query("SELECT * FROM users_extra WHERE user_id::text = $1::text", [referrer.id]);
  console.log("Final users_extra for referrer:", finalUe.rows);

  const txns = await pool.query("SELECT * FROM referral_transactions WHERE referrer_id::text = $1::text", [referrer.id]);
  console.log("Transactions for referrer:", txns.rows);

  await pool.end();
}

main().catch(console.error);
