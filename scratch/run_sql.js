const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Read .env.local manually to get DATABASE_URL if it exists
// or use a fallback. 
// Since I couldn't find DATABASE_URL in .env.local earlier, 
// let's try to find where it is.
// Actually, let's just use the connection info from the user's setup.

async function runSql() {
  // If the user hasn't provided a DATABASE_URL in .env.local, 
  // maybe it's in the system env or we need to find it.
  
  // Let's check for DATABASE_URL in the current process env first
  let dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    // Try to read it from .env or .env.local again
    const envPath = path.join(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/DATABASE_URL=(.+)/);
      if (match) dbUrl = match[1].trim();
    }
  }

  if (!dbUrl) {
    // Check postgres_schema.sql for clues? No.
    // Let's assume it's standard local if not found.
    dbUrl = 'postgres://postgres:postgres@localhost:5432/gymdate';
  }

  console.log('Connecting to database...');
  const pool = new Pool({ connectionString: dbUrl });
  
  try {
    const sqlPath = path.join(__dirname, 'standardize_config.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing SQL...');
    await pool.query(sql);
    console.log('Successfully standardized configuration keys.');
  } catch (err) {
    console.error('Error running SQL:', err.message);
  } finally {
    await pool.end();
  }
}

runSql();
