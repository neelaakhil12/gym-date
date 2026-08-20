"use server";

import { getServerSession } from "next-auth/next";
import { partnerAuthOptions } from "@/app/api/auth/partner/[...nextauth]/route";
import { query } from "@/lib/db";

export async function verifyTicketAction(ticketCode: string, providedPartnerId?: string) {
  try {
    const rawCode = (ticketCode || "").trim();
    if (!rawCode) {
      return { error: "No ticket code provided." };
    }

    let partnerId = providedPartnerId;

    // 1. Fetch available columns from bookings table
    const colsRes = await query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'bookings'
    `);
    const bookingCols = new Set((colsRes.rows || []).map((r: any) => r.column_name.toLowerCase()));

    let bookingData = null;
    const whereParts = [`id::text ILIKE $1`, `id::text ILIKE $2`];
    if (bookingCols.has("ticket_code")) {
      whereParts.push(`ticket_code ILIKE $1`);
      whereParts.push(`ticket_code ILIKE $2`);
    }

    const codeResult = await query(
      `SELECT * FROM bookings 
       WHERE ${whereParts.join(" OR ")}
       ORDER BY created_at DESC LIMIT 1`,
      [rawCode, `${rawCode}%`]
    );

    if (codeResult.rows.length > 0) {
      bookingData = codeResult.rows[0];
    }

    if (!bookingData) {
      return { error: `Ticket "${rawCode}" not found in system.` };
    }

    // 2. Fetch the gym details
    const gymResult = await query("SELECT id, name, partner_id FROM gyms WHERE id::text = $1::text", [String(bookingData.gym_id)]);
    const gym = gymResult.rows[0] || { id: bookingData.gym_id, name: "Partner Gym", partner_id: null };

    // 3. Security Check (If partnerId is provided or in session)
    if (!partnerId) {
      const session = await getServerSession(partnerAuthOptions);
      if (session?.user?.id && (session.user as any).role === 'partner') {
        partnerId = (session.user as any).id;
      }
    }

    // If partner is logged in, verify against partner's owned gym
    if (partnerId && gym.partner_id && String(gym.partner_id) !== String(partnerId)) {
      // Also check if partner owns this gym via gyms table
      const partnerGymRes = await query("SELECT id FROM gyms WHERE partner_id::text = $1::text", [String(partnerId)]);
      const ownsGym = partnerGymRes.rows.some((g: any) => String(g.id) === String(bookingData.gym_id));
      if (!ownsGym) {
        return { 
          error: `Access Denied: This pass is for ${gym.name}, not your gym.`,
          booking: bookingData
        };
      }
    }

    // 4. Expiration Check
    if (bookingData.end_date) {
      const now = new Date();
      const endDate = new Date(bookingData.end_date);
      if (now > endDate) {
        return { 
          error: `Pass Expired on ${endDate.toLocaleDateString('en-IN')}`, 
          booking: bookingData 
        };
      }
    }

    // 5. Ensure customer name is retrieved from users table if not on booking
    let displayName = bookingData.customer_name;
    if (!displayName || displayName === "Member") {
      if (bookingData.user_id) {
        const userRes = await query("SELECT full_name, email FROM users WHERE id::text = $1::text", [String(bookingData.user_id)]);
        if (userRes.rows.length > 0 && userRes.rows[0].full_name) {
          displayName = userRes.rows[0].full_name;
        }
      }
    }
    displayName = displayName || "Member";

    const finalBooking = {
      ...bookingData,
      customer_name: displayName
    };

    return { success: true, booking: finalBooking, gymName: gym.name };

  } catch (err: any) {
    console.error("Verification error:", err);
    return { error: `Verification failed: ${err.message || "Unknown error"}` };
  }
}
