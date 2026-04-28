import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runSql() {
  console.log("--- Running SQL Migration ---");
  
  // Since we can't run raw SQL directly via the JS client easily without a RPC
  // I will try to use the 'rest' api or just assume the user will run it.
  // Actually, I can try to use a simple update to see if the column exists.
  
  const { error } = await supabase
    .from('bookings')
    .select('ticket_code')
    .limit(1);

  if (error && error.message.includes('column "ticket_code" does not exist')) {
    console.log("Column 'ticket_code' missing. Please run the SQL script in Supabase dashboard:");
    console.log(`
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS ticket_code TEXT UNIQUE;
      UPDATE bookings SET ticket_code = 'GD-' || upper(substring(id::text from 1 for 6)) WHERE ticket_code IS NULL;
    `);
  } else if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Column 'ticket_code' exists!");
  }
}

runSql();
