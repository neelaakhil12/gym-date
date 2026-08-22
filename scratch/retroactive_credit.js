const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function retroactiveCredit() {
  try {
    // 1. Find referrer (neelaakhilharish@gmail.com)
    const referrerRes = await pool.query("SELECT * FROM users WHERE email = 'neelaakhilharish@gmail.com'");
    if (referrerRes.rows.length === 0) {
      console.log("Referrer not found");
      return;
    }
    const referrer = referrerRes.rows[0];

    // 2. Ensure referral code exists for referrer
    let codeRes = await pool.query("SELECT referral_code FROM users_extra WHERE user_id = $1", [referrer.id]);
    let code = codeRes.rows[0]?.referral_code;
    if (!code) {
      code = '85FC345D'; // The code shown in the user's latest screenshot!
      await pool.query(`
        INSERT INTO users_extra (user_id, referral_code, wallet_balance, updated_at)
        VALUES ($1, $2, 0, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) DO UPDATE SET referral_code = EXCLUDED.referral_code
      `, [referrer.id, code]);
      console.log(`Set permanent referral code ${code} for ${referrer.email}`);
    }

    // 3. Find referee (harishneela71@gmail.com)
    const refereeRes = await pool.query("SELECT * FROM users WHERE email = 'harishneela71@gmail.com'");
    if (refereeRes.rows.length > 0) {
      const referee = refereeRes.rows[0];
      
      // Update referee's referred_by
      await pool.query(`
        INSERT INTO users_extra (user_id, referred_by, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) DO UPDATE SET referred_by = EXCLUDED.referred_by
      `, [referee.id, code]);

      // Check if already credited in referral_transactions
      const txnCheck = await pool.query(
        "SELECT id FROM referral_transactions WHERE referrer_id = $1 AND referred_user_email = $2",
        [referrer.id, referee.email]
      );

      if (txnCheck.rows.length === 0) {
        // Credit ₹30 to referrer wallet
        await pool.query(`
          INSERT INTO users_extra (user_id, wallet_balance, updated_at)
          VALUES ($1, 30, CURRENT_TIMESTAMP)
          ON CONFLICT (user_id) DO UPDATE SET wallet_balance = COALESCE(users_extra.wallet_balance, 0) + 30
        `, [referrer.id]);

        // Insert referral transaction
        await pool.query(`
          INSERT INTO referral_transactions (referrer_id, referred_user_email, type, amount, status)
          VALUES ($1, $2, 'user', 30, 'credited')
        `, [referrer.id, referee.email]);

        console.log(`Successfully credited ₹30 to ${referrer.email} for referral of ${referee.email}`);
      }
    }

    // Check final state
    const finalState = await pool.query(`
      SELECT u.email, ue.referral_code, ue.referred_by, ue.wallet_balance
      FROM users u
      JOIN users_extra ue ON u.id = ue.user_id
      WHERE u.email IN ('neelaakhilharish@gmail.com', 'harishneela71@gmail.com')
    `);
    console.table(finalState.rows);

    const txns = await pool.query("SELECT * FROM referral_transactions");
    console.table(txns.rows);

  } catch (err) {
    console.error("Credit Error:", err);
  } finally {
    pool.end();
  }
}

retroactiveCredit();
