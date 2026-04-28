const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Simple env parser
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

async function checkSchema() {
  const { data, error } = await supabase
    .from('pricing_plans')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error(error);
  } else {
    console.log('Columns in pricing_plans:', Object.keys(data[0] || {}));
  }
}

checkSchema();
