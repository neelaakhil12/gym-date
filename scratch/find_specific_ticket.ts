import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findTicket(code: string) {
  console.log(`--- Searching for Ticket Code: ${code} ---`);
  
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('ticket_code', code)
    .single();

  if (error) {
    console.error("Error:", error.message);
    // Also try case-insensitive or partial match
    const { data: list } = await supabase
      .from('bookings')
      .select('ticket_code')
      .ilike('ticket_code', `%${code}%`);
    console.log("Partial matches found:", list?.map(l => l.ticket_code));
  } else {
    console.log("Ticket Found!", data);
  }
}

findTicket('GD-0QRY6Q');
