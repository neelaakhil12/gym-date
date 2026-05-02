import { query } from './src/lib/db';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    console.log('Testing raw SQL...');
    const res = await query('SELECT * FROM payout_requests');
    console.log('Raw SQL rows:', res.rows.length);
    console.dir(res.rows, { depth: null });
  } catch (err: any) {
    console.log('Raw SQL error:', err.message);
  }

  try {
    console.log('\nTesting Supabase client...');
    const { data, error } = await supabase.from('payout_requests').select('*');
    if (error) {
      console.log('Supabase error:', error.message);
    } else {
      console.log('Supabase rows:', data?.length);
      console.dir(data, { depth: null });
    }
  } catch (err: any) {
    console.log('Supabase catch error:', err.message);
  }
}

test();
