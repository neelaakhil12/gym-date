const { query } = require('./src/lib/db');

async function main() {
  try {
    const res = await query("SELECT column_name FROM information_schema.columns WHERE table_name='partner_requests'");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  }
}

main();
