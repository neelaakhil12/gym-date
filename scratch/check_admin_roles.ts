import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAdmins() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, role_id')
    .order('role_id', { ascending: false });

  if (error) {
    console.error("Error fetching profiles:", error.message);
    return;
  }

  console.log("Current Profiles and Roles:");
  console.table(profiles);
  
  // If we want to make someone a super admin, we can do it here
  // const targetEmail = '...';
  // const { error: updateError } = await supabase
  //   .from('profiles')
  //   .update({ role_id: 'super_admin' })
  //   .eq('email', targetEmail);
}

checkAdmins();
