import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTables() {
  const { data, error } = await supabase.rpc('get_tables'); // This might not work if RPC isn't there
  if (error) {
    console.log("RPC get_tables failed, trying direct query on information_schema...");
    const { data: tables, error: tableError } = await supabase.from('pg_tables').select('tablename').eq('schemaname', 'public');
    // Note: 'pg_tables' might not be accessible via standard Supabase client even with service role
    // Let's just try to select from 'amenities' and see if it errors
  }
  
  try {
    const { error: amenError } = await supabase.from('amenities').select('*').limit(1);
    if (amenError) {
      console.log("Amenities table does not exist or is inaccessible:", amenError.message);
    } else {
      console.log("Amenities table EXISTS.");
    }
    
    const { error: bookError } = await supabase.from('bookings').select('*').limit(1);
    if (bookError) {
      console.log("Bookings table does not exist or is inaccessible:", bookError.message);
    } else {
      console.log("Bookings table EXISTS.");
    }
  } catch (e) {
    console.log("Error:", e);
  }
}

checkTables();
