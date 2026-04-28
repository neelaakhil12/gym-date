import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkPartnerById() {
  const partnerId = 'acc234a8-3769-41d3-be1c-8dbfc8d635e3';
  console.log(`Checking profile for partner ID: ${partnerId}`);
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', partnerId)
    .single();

  if (profile) {
    console.log("Partner Profile found:", profile);
  } else {
    console.log("No profile found with this ID.");
  }
}

checkPartnerById();
