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

async function checkGyms() {
  // Check users
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  const targetUser = users.users.find(u => u.email === 'akhilneela95@gmail.com');
  
  if (!targetUser) {
    console.log('User not found in auth.users');
    return;
  }
  
  console.log('User ID:', targetUser.id);
  
  // Check gyms
  const { data: gyms, error: gymError } = await supabase
    .from('gyms')
    .select('*')
    .eq('partner_id', targetUser.id);
  
  if (gymError) {
    console.error('Error fetching gyms:', gymError);
  } else {
    console.log('Gyms found for user:', gyms.length);
    if (gyms.length > 0) {
      console.log('Gym ID:', gyms[0].id);
      console.log('Gym Name:', gyms[0].name);
    }
  }
}

checkGyms();
