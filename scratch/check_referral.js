const { query } = require('./src/lib/db');

async function checkReferral() {
  const code = 'CB8E4B47';
  try {
    const res = await query(`
      SELECT u.id, u.email, u.referral_code, u.role_id, g.name as gym_name
      FROM users u
      LEFT JOIN gyms g ON u.id::text = g.partner_id::text
      WHERE u.referral_code = $1
    `, [code]);
    
    console.log('Referral Info:', JSON.stringify(res.rows, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

checkReferral();
