import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// We use the regular key but try to simulate a session if possible, 
// or just use the service role to check if the gym_id actually matches what the partner HAS.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkPartnerGymMatch() {
  const partnerId = 'acc234a8-3769-41d3-be1c-8dbfc8d635e3'; // Fit Arc Gym Owner
  const ticketCode = 'GD-0QRY6Q';

  console.log(`--- Checking Match for Partner ${partnerId} ---`);

  // 1. Get Gym for this partner
  const { data: gym } = await supabase
    .from('gyms')
    .select('id, name')
    .eq('partner_id', partnerId)
    .single();

  console.log("Partner Gym:", gym?.name, "ID:", gym?.id);

  // 2. Get Booking
  const { data: booking } = await supabase
    .from('bookings')
    .select('gym_id, ticket_code')
    .eq('ticket_code', ticketCode)
    .single();

  console.log("Booking Gym ID:", booking?.gym_id);
  console.log("Match?", booking?.gym_id === gym?.id);
}

checkPartnerGymMatch();
