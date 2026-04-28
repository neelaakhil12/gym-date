const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listPartners() {
  const { data: gyms, error: gymError } = await supabase
    .from('gyms')
    .select('name, partner_id');
  
  if (gymError) {
    console.error('Error fetching gyms:', gymError);
    return;
  }

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('role_id', 'partner');

  if (profileError) {
    console.error('Error fetching profiles:', profileError);
    return;
  }

  console.log('--- Gym Partner Email List ---');
  gyms.forEach(gym => {
    const partner = profiles.find(p => p.id === gym.partner_id);
    if (partner) {
      console.log(`Gym: ${gym.name} -> Partner Email: ${partner.email} (${partner.full_name})`);
    } else {
      console.log(`Gym: ${gym.name} -> Partner not found (ID: ${gym.partner_id})`);
    }
  });
}

listPartners();
