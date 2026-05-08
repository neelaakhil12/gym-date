const { query } = require('./src/lib/db');

async function checkConfig() {
  try {
    const res = await query('SELECT * FROM platform_config');
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkConfig();
