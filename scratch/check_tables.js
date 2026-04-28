const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8')
  .split('\n')
  .reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
  }, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTable(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`Table '${tableName}' does not exist or has an error:`, error.message);
    } else {
      console.log(`Table '${tableName}' exists. Columns:`, Object.keys(data[0] || {}));
    }
  } catch (e) {
    console.log(`Table '${tableName}' check failed.`);
  }
}

async function run() {
  await checkTable('wallets');
  await checkTable('payout_requests');
}

run();
