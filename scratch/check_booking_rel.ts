import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkBookingRelationships() {
  console.log("--- Checking Booking Relationships ---");
  
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*, profiles(*)')
    .limit(1)
    .single();

  if (error) {
    console.error("Query Error:", error.message);
  } else {
    console.log("Booking found with profiles:", !!booking.profiles);
    console.log("Booking user_id:", booking.user_id);
    console.log("Profile Name:", booking.profiles?.full_name);
  }
}

checkBookingRelationships();
