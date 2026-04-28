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

    // 2. Find the booking by ID or Ticket Code (Simple lookup first)
    let bookingData = null;
    
    // Try Ticket Code first (case-insensitive)
    const { data: byCode } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .ilike('ticket_code', ticketCode.trim())
      .single();
    
    if (byCode) {
      bookingData = byCode;
    } else {
      // Try UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ticketCode.trim());
      if (isUUID) {
        const { data: byId } = await supabaseAdmin
          .from('bookings')
          .select('*')
          .eq('id', ticketCode.trim())
          .single();
        bookingData = byId;
      }
    }

    if (!bookingData) {
      return { error: `Invalid Ticket: Ticket "${ticketCode}" not found in system.` };
    }

    // 2.5 Fetch profile if it exists (separately to avoid join issues)
    if (bookingData.user_id) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', bookingData.user_id)
        .single();
      if (profile) {
        (bookingData as any).profiles = profile;
      }
    }

    // 3. Security Check: Gym Mismatch
    if (bookingData.gym_id !== gym.id) {
      return { error: `Access Denied: This ticket belongs to a different gym.` };
    }

    // 4. Expiration Check: Ensure subscription is still valid
    const now = new Date();
    const endDate = new Date(bookingData.end_date);
    if (now > endDate) {
      return { error: `Access Denied: This subscription expired on ${endDate.toLocaleDateString()}.` };
    }

    // 5. Ensure name is populated (fallback to profile if booking name is empty)
    const displayName = bookingData.customer_name || (bookingData as any).profiles?.full_name || "Anonymous User";
    const finalBooking = {
      ...bookingData,
      customer_name: displayName // Override with the best available name
    };

    // 6. Return success with booking data
    return { success: true, booking: finalBooking, gymName: gym.name };

  } catch (err: any) {
    console.error("Verification error:", err);
    return { error: "An internal error occurred during verification." };
  }
}
