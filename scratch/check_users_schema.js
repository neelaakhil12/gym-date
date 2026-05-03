const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://gymdate_user:GymDate@DB2024!@localhost:5432/gymdate_db"
});

async function checkSchema() {
  await client.connect();
  const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
  console.log(res.rows.map(r => r.column_name));
  await client.end();
}

checkSchema();
