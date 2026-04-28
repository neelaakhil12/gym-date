import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkPolicies() {
  console.log("--- Checking RLS Policies ---");
  
  const { data, error } = await supabase.rpc('get_policies', { table_name: 'bookings' });

  if (error) {
    // If RPC doesn't exist, try querying pg_policies via raw SQL if possible, 
    // but usually I can't. So I'll just try a regular query with a user session if I had one.
    console.error("Error fetching policies:", error.message);
  } else {
    console.log("Policies:", data);
  }
}

checkPolicies();
