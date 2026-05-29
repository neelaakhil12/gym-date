const { query } = require('./src/lib/db');

async function debugDatabaseLink() {
  const code = '70D3A107'; // The code from your screenshot
  try {
    const res = await query(`
      SELECT 
        u.id as user_id,
        u.email,
        u.full_name,
        g.id as gym_id,
        g.name as gym_name
      FROM users u
      LEFT JOIN gyms g ON u.id::text = g.partner_id::text
      WHERE u.referral_code = $1
    `, [code]);
    
    console.log('--- DATABASE LINK CHECK ---');
    if (res.rows.length === 0) {
      console.log('Error: No user found with referral code:', code);
    } else {
      const row = res.rows[0];
      console.log('User found:', row.full_name, `(${row.email})`);
      if (row.gym_name) {
        console.log('SUCCESS: This user is linked to gym:', row.gym_name);
      } else {
        console.log('FAILURE: This user has NO gym linked in the "gyms" table.');
        console.log('User ID:', row.user_id);
        console.log('Note: To fix this, a gym must be created in the Gyms tab and assigned to this user.');
      }
    }
  } catch (err) {
    console.error('Query Error:', err);
  } finally {
    process.exit();
  }
}

debugDatabaseLink();
