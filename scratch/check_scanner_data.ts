import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkPartnerAndBookings() {
  console.log("--- Checking Partner Account ---");
  
  // 1. Get the partner profile
  // The user likely logged in with: santoedgepvtltd@gmail.com (as seen in .env.local SMTP)
  // Let's check all profiles with role 'partner'
  const { data: partners } = await supabase
    .from('profiles')
    .select('*')
    .eq('role_id', 'partner');

  console.log("Partners found:", partners?.length);
  partners?.forEach(p => console.log(`- ${p.full_name} (${p.email}) ID: ${p.id}`));

  // 2. Get Gyms and their partner_ids
  console.log("\n--- Checking Gyms ---");
  const { data: gyms } = await supabase
    .from('gyms')
    .select('id, name, partner_id');
  
  gyms?.forEach(g => console.log(`- Gym: ${g.name}, ID: ${g.id}, Partner ID: ${g.partner_id}`));

  // 3. Get Bookings
  console.log("\n--- Checking Bookings ---");
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, gym_id, user_id, status')
    .limit(5);

  bookings?.forEach(b => console.log(`- Booking: ${b.id}, Gym ID: ${b.gym_id}, Status: ${b.status}`));

  if (partners && partners.length > 0 && gyms && gyms.length > 0) {
    const partner = partners[0];
    const partnerGym = gyms.find(g => g.partner_id === partner.id);
    
    if (partnerGym) {
      console.log(`\nPartner ${partner.full_name} owns gym ${partnerGym.name}`);
      const { data: gymBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('gym_id', partnerGym.id);
      console.log(`Gym ${partnerGym.name} has ${gymBookings?.length} bookings.`);
    } else {
      console.log("\nWARNING: No gym found associated with partner ID", partner.id);
    }
  }
}

checkPartnerAndBookings();
