const { query } = require('./src/lib/db');

async function check() {
  try {
    const res = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'gyms' AND column_name = 'commission_rate'");
    if (res.rows.length === 0) {
      console.log("MISSING_COLUMN: commission_rate");
    } else {
      console.log("COLUMN_EXISTS: commission_rate");
    }
  } catch (e) {
    console.error(e);
  }
}
check();
