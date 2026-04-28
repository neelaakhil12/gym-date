"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function verifyTicketAction(ticketCode: string, partnerId: string) {
  try {
    // 1. Get the partner's gym
    const { data: gym, error: gymError } = await supabaseAdmin
      .from('gyms')
      .select('id, name')
      .eq('partner_id', partnerId)
      .single();

    if (gymError || !gym) {
      return { error: "Authorized gym not found for this partner." };
    }

    // 2. Find the booking by ID or Ticket Code
    let bookingData = null;
    
    // Try UUID first
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ticketCode);
    if (isUUID) {
      const { data } = await supabaseAdmin
        .from('bookings')
        .select('*, profiles(full_name, avatar_url)')
        .eq('id', ticketCode)
        .single();
      bookingData = data;
    }

    // Try Ticket Code if not found or not UUID
    if (!bookingData) {
      const { data } = await supabaseAdmin
        .from('bookings')
        .select('*, profiles(full_name, avatar_url)')
        .eq('ticket_code', ticketCode)
        .single();
      bookingData = data;
    }

    if (!bookingData) {
      return { error: `Invalid Ticket: No booking found for code ${ticketCode}` };
    }

    // 3. Security Check: Gym Mismatch
    if (bookingData.gym_id !== gym.id) {
      return { error: `Access Denied: This ticket belongs to a different gym.` };
    }

    // 4. Return success with booking data
    return { success: true, booking: bookingData, gymName: gym.name };

  } catch (err: any) {
    console.error("Verification error:", err);
    return { error: "An internal error occurred during verification." };
  }
}
