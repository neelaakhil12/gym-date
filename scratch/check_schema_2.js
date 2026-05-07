const { query } = require('../src/lib/db');

async function main() {
  try {
    const res = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'partner_requests'");
    console.log("SCHEMA_START");
    console.log(JSON.stringify(res.rows, null, 2));
    console.log("SCHEMA_END");
  } catch (e) {
    console.error(e.message);
  }
}

main();
