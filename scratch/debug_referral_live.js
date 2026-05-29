const { query } = require('./src/lib/db');

async function debugReferral() {
  const code = 'CB8E4B47';
  try {
    const res = await query(`
      SELECT 
        u.id, 
        u.email, 
        u.full_name, 
        u.role_id, 
        g.name as gym_name
      FROM users u
      LEFT JOIN gyms g ON u.id::text = g.partner_id::text
      WHERE u.referral_code = $1
    `, [code]);
    
    if (res.rows.length === 0) {
      console.log('No user found for code:', code);
    } else {
      console.log('Referrer Details:', JSON.stringify(res.rows[0], null, 2));
    }
  } catch (error) {
    console.error('Database Error:', error);
  } finally {
    process.exit();
  }
}

debugReferral();
