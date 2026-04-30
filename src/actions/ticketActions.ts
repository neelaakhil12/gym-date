"use server";

import { query } from "@/lib/db";

export async function verifyTicketAction(ticketCode: string, partnerId: string) {
  try {
    // 1. Get the partner's gym
    const gymResult = await query("SELECT id, name FROM gyms WHERE partner_id = $1", [partnerId]);
    if (gymResult.rows.length === 0) {
      return { error: "Authorized gym not found for this partner." };
    }
    const gym = gymResult.rows[0];

    // 2. Find the booking by ID or Ticket Code (Simple lookup first)
    let bookingData = null;
    
    // Check if ticketCode has a 'ticket_code' column (assuming it might exist or fall back to ID)
    // Actually, their original code checked `ticket_code` column. If it doesn't exist, this will error.
    // Let's wrap in try/catch or just check ID. Their code had `ilike 'ticket_code'`.
    try {
      const codeResult = await query("SELECT * FROM bookings WHERE ticket_code ILIKE $1", [ticketCode.trim()]);
      if (codeResult.rows.length > 0) {
        bookingData = codeResult.rows[0];
      }
    } catch (e) {
      // ticket_code column might not exist, ignore and check ID
    }

    if (!bookingData) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ticketCode.trim());
      if (isUUID) {
        const idResult = await query("SELECT * FROM bookings WHERE id = $1", [ticketCode.trim()]);
        if (idResult.rows.length > 0) bookingData = idResult.rows[0];
      }
    }

    if (!bookingData) {
      return { error: `Invalid Ticket: Ticket "${ticketCode}" not found in system.` };
    }

    // 2.5 Fetch profile if it exists
    if (bookingData.user_id) {
      const profileResult = await query("SELECT full_name, email as avatar_url FROM users WHERE id = $1", [bookingData.user_id]);
      if (profileResult.rows.length > 0) {
        (bookingData as any).profiles = profileResult.rows[0];
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

    // 5. Ensure name is populated
    const displayName = bookingData.customer_name || (bookingData as any).profiles?.full_name || "Anonymous User";
    const finalBooking = {
      ...bookingData,
      customer_name: displayName
    };

    // 6. Return success with booking data
    return { success: true, booking: finalBooking, gymName: gym.name };

  } catch (err: any) {
    console.error("Verification error:", err);
    return { error: "An internal error occurred during verification." };
  }
}
