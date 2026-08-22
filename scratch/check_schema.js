const { Pool } = require('pg');
const fs = require('fs');

let connStr = '';
const lines = fs.readFileSync('/var/www/gymdate/.env.local', 'utf8').split('\n');
for (const line of lines) {
  if (line.startsWith('DATABASE_URL=')) {
    connStr = line.split('=')[1].trim().replace(/^['"]|['"]$/g, '');
  }
}

const pool = new Pool({ connectionString: connStr });
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'partner_requests'")
  .then(res => {
    console.log('PARTNER_REQUESTS COLUMNS:', res.rows);
    pool.end();
  })
  .catch(err => {
    console.error('ERROR:', err);
    pool.end();
  });
