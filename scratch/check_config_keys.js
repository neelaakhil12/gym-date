const { query } = require('../src/lib/db');

async function run() {
  try {
    const res = await query('SELECT * FROM platform_config');
    console.log('CONFIG:', res.rows);
  } catch (e) {
    console.error(e);
  }
}
run();
