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
  env.SUPABASE_SERVICE_ROLE_KEY // Using service role to bypass RLS for testing
);

async function updateCultGymStatus() {
  // Find the cult sports gym
  const { data: gyms, error: fetchError } = await supabase
    .from('gyms')
    .select('id, name, status')
    .ilike('name', '%cult sports%');
  
  if (fetchError) {
    console.error('Fetch Error:', fetchError);
    return;
  }

  console.log('Found gyms:', gyms);

  if (gyms && gyms.length > 0) {
    const gymId = gyms[0].id;
    console.log(`Updating gym ${gymId} to 'Closed'...`);
    
    const { error: updateError } = await supabase
      .from('gyms')
      .update({ status: 'Closed' })
      .eq('id', gymId);
    
    if (updateError) {
      console.error('Update Error:', updateError);
    } else {
      console.log('Successfully updated status to Closed in database!');
      
      // Verify
      const { data: verified } = await supabase
        .from('gyms')
        .select('status')
        .eq('id', gymId)
        .single();
      console.log('Verified status in DB:', verified.status);
    }
  }
}

updateCultGymStatus();
