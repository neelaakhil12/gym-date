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

async function checkGymsSchema() {
  const { data, error } = await supabase
    .from('gyms')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error(error);
  } else {
    const firstRow = data[0];
    if (firstRow) {
      console.log('Gym ID type check:');
      console.log('ID value:', firstRow.id);
      console.log('Type of ID:', typeof firstRow.id);
    }
  }
}

checkGymsSchema();
