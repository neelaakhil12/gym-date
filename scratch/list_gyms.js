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

async function listAllGyms() {
  const { data: gyms, error } = await supabase.from('gyms').select('id, name, partner_id');
  if (error) {
    console.error(error);
  } else {
    console.log('Total Gyms:', gyms.length);
    gyms.forEach(g => {
      console.log(`Gym: ${g.name}, Partner ID: ${g.partner_id}`);
    });
  }
}

listAllGyms();
