const { query } = require('./src/lib/db');

async function checkFitArc() {
  const code = '70D3A107';
  try {
    const res = await query(`
      SELECT 
        u.email, 
        u.full_name, 
        g.name as gym_name
      FROM users u
      LEFT JOIN gyms g ON u.id::text = g.partner_id::text
      WHERE u.referral_code = $1
    `, [code]);
    
    console.log('--- Referral Check for 70D3A107 ---');
    if (res.rows.length === 0) {
      console.log('No user found for this code.');
    } else {
      const data = res.rows[0];
      console.log('Email:', data.email);
      console.log('Owner Name:', data.full_name);
      console.log('Gym Name:', data.gym_name || 'NOT FOUND (User has no gym profile yet)');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

checkFitArc();
