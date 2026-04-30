import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function promoteToAdmin() {
  const targetEmail = 'neelaakhilkumar50@gmail.com';
  
  console.log(`Promoting ${targetEmail} to super_admin...`);
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ role_id: 'super_admin' })
    .eq('email', targetEmail)
    .select();

  if (error) {
    console.error("Error promoting user:", error.message);
  } else {
    console.log("Success! Updated profile:");
    console.table(data);
  }
}

promoteToAdmin();
