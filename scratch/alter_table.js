const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://gymdate_user:GymDate@DB2024!@127.0.0.1:5432/gymdate_db'
});

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL on 127.0.0.1');
  await client.query('ALTER TABLE platform_config ALTER COLUMN value TYPE TEXT;');
  await client.query('ALTER TABLE platform_config ALTER COLUMN description TYPE TEXT;');
  console.log('SUCCESS: platform_config columns altered to TEXT successfully!');
  await client.end();
}

main().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
