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

async function fixPartnerAssignment() {
  // 1. Get User ID for akhilneela95@gmail.com
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === 'akhilneela95@gmail.com');
  
  if (!user) {
    console.log('User not found');
    return;
  }

  // 2. Find a gym to assign (let's pick the first one without a partner or just the first one)
  const { data: gyms } = await supabase.from('gyms').select('id, name').limit(1);
  
  if (!gyms || gyms.length === 0) {
    console.log('No gyms found to assign.');
    return;
  }

  const gymId = gyms[0].id;
  console.log(`Assigning Gym "${gyms[0].name}" (${gymId}) to user ${user.email} (${user.id})`);

  // 3. Update the gym's partner_id
  const { error: updateError } = await supabase
    .from('gyms')
    .update({ partner_id: user.id })
    .eq('id', gymId);

  if (updateError) {
    console.error('Error updating gym:', updateError);
  } else {
    console.log('Gym assigned successfully!');
  }
}

fixPartnerAssignment();
