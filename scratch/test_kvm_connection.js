const { Client } = require('pg');

async function testConn() {
  const connectionString = "postgresql://gymdate_user:GymDate@DB2024!@77.37.44.221:5432/gymdate_db";
  console.log("Testing connection to KVM database IP:", connectionString);
  
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    console.log("SUCCESS! Connected to remote KVM database!");
    const res = await client.query("SELECT COUNT(*) FROM users");
    console.log("Number of users in KVM database:", res.rows[0].count);
  } catch (err) {
    console.error("Connection failed:", err.message);
  } finally {
    await client.end();
  }
}

testConn();
