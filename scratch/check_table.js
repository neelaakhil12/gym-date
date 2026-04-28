const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTable() {
  const { error } = await supabase.from('otps').select('*').limit(1);
  if (error && error.code === '42P01') {
    console.log('TABLE_MISSING');
  } else {
    console.log('TABLE_EXISTS');
  }
}

checkTable();
