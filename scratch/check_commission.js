const { query } = require('./src/lib/db');

async function checkConfig() {
  try {
    const res = await query('SELECT * FROM platform_config');
    console.log('Platform Config:', res.rows);
    
    const gyms = await query('SELECT id, name, commission_rate FROM gyms LIMIT 5');
    console.log('Gyms Commission Rates:', gyms.rows);
  } catch (err) {
    console.error(err);
  }
}

checkConfig();
