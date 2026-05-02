"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { query } from "@/lib/db";

export async function verifyTicketAction(ticketCode: string, providedPartnerId?: string) {
  try {
    let partnerId = providedPartnerId;

    // 1. Fetch the booking first (independent of session)
    let bookingData = null;
    
    // Check ticket_code
    const codeResult = await query("SELECT * FROM bookings WHERE ticket_code = $1 OR id::text = $1", [ticketCode.trim()]);
    if (codeResult.rows.length > 0) {
      bookingData = codeResult.rows[0];
    }

    if (!bookingData) {
      return { error: `Invalid Ticket: Ticket "${ticketCode}" not found in system.` };
    }

    // 2. Fetch the gym details
    const gymResult = await query("SELECT id, name, partner_id FROM gyms WHERE id = $1", [bookingData.gym_id]);
    if (gymResult.rows.length === 0) {
      return { error: "Associated gym not found." };
    }
    const gym = gymResult.rows[0];

    // 3. Security Check (If partnerId is provided or in session)
    if (!partnerId) {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        partnerId = (session.user as any).id;
      }
    }

    // Optional: If we want to strictly enforce that the logged-in partner owns the gym
    if (partnerId && String(gym.partner_id) !== String(partnerId)) {
       return { 
         error: "Access Denied: This ticket belongs to a different gym.",
         booking: bookingData // Return it anyway so scanner can redirect to verify page if needed
       };
    }

    // 4. Expiration Check
    const now = new Date();
    const endDate = new Date(bookingData.end_date);
    if (now > endDate) {
      return { error: `Access Denied: This subscription expired on ${endDate.toLocaleDateString()}.`, booking: bookingData };
    }

    // 5. Ensure name is populated
    const displayName = bookingData.customer_name || "Member";
    const finalBooking = {
      ...bookingData,
      customer_name: displayName
    };

    return { success: true, booking: finalBooking, gymName: gym.name };

  } catch (err: any) {
    console.error("Verification error:", err);
    return { error: "An internal error occurred during verification." };
  }
}
