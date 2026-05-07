const { query } = require('./src/lib/db');

async function main() {
  try {
    await query("ALTER TABLE partner_requests ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'");
    console.log('Column added successfully');
  } catch (err) {
    console.error(err);
  }
}

main();
