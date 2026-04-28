import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTable() {
  const { data, error } = await supabase
    .from('platform_stats')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Platform Stats Data:', data);
    
    // Check if there's a settings table
    const { data: tables, error: tablesError } = await supabase.rpc('get_tables');
    if (tablesError) {
        console.log("Could not list tables via RPC");
    } else {
        console.log("Tables:", tables);
    }
  }
}

checkTable();
