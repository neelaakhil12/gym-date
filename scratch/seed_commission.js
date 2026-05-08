const { query } = require('./src/lib/db');

async function check() {
  try {
    const res = await query('SELECT * FROM platform_config');
    console.log('KEYS:', res.rows.map(r => r.key));
    
    // Also check if platform_commission exists, if not, create it
    const existing = res.rows.find(r => r.key === 'platform_commission');
    if (!existing) {
      console.log('platform_commission not found, creating it...');
      await query("INSERT INTO platform_config (key, value, description) VALUES ('platform_commission', '10', 'Global platform commission percentage for all gyms (fallback if gym rate not set).')");
      console.log('Successfully created platform_commission with default 10%');
    }
  } catch (e) {
    console.error(e);
  }
}
check();
