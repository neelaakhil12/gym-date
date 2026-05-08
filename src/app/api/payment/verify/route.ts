import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { query } from "@/lib/db";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { computeEndDate } from "@/lib/planDuration";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      gymId,
      planName,
      amount,
      startDate,
      customerName,
      customerPhone,
      customerEmail,
    } = body;

    // ── 1. Verify HMAC signature ──────────────────────────────────────────
    const message = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(message)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Payment verification failed — invalid signature" },
        { status: 400 }
      );
    }

    // ── 2. Compute plan duration and set end_date ─────────────────────────
    const today = startDate ? new Date(startDate) : new Date();
    today.setHours(0, 0, 0, 0); // normalize to start of day
    const endDate = computeEndDate(today, planName || "");
    const ticketCode = `GD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // ── 3. Find or Create Profile (Always resolve internal ID from email for consistency) ──
    let finalUserId = null;
    if (customerEmail) {
      const userRes = await query('SELECT id FROM users WHERE email = $1', [customerEmail]);
      
      if (userRes.rows.length > 0) {
        finalUserId = userRes.rows[0].id;
      } else {
        const newUserRes = await query(
          `INSERT INTO users (email, full_name, phone, role_id) 
           VALUES ($1, $2, $3, 'user') RETURNING id`,
          [customerEmail, customerName, customerPhone]
        );
        if (newUserRes.rows.length > 0) {
          finalUserId = newUserRes.rows[0].id;
        }
      }
    }

    // ── 4. Insert booking into Postgres ───────────────────────────────────
    let bookingId;
    try {
      console.log("[Postgres] Attempting to insert booking:", {
        finalUserId, gymId, planName, amount, razorpay_payment_id, razorpay_order_id, today, endDate
      });
      
      const bookingRes = await query(
        `INSERT INTO bookings (
          user_id, gym_id, customer_name, customer_email, plan_name, amount, 
          status, payment_id, razorpay_order_id, ticket_code, start_date, end_date
        ) VALUES ($1, $2, $3, $4, $5, $6, 'completed', $7, $8, $9, $10, $11) RETURNING id`,
        [
          finalUserId || null, 
          gymId,
          customerName,
          customerEmail,
          planName, 
          Number(amount), 
          razorpay_payment_id, 
          razorpay_order_id,
          ticketCode,
          today.toISOString(), 
          endDate.toISOString()
        ]
      );
      bookingId = bookingRes.rows[0].id;
      console.log("[Postgres] Booking created successfully ID:", bookingId);
    } catch (error: any) {
      console.error("[Postgres] booking insert error detail:", {
        message: error.message,
        code: error.code,
        detail: error.detail,
        table: error.table,
        constraint: error.constraint
      });
      return NextResponse.json(
        { error: `Booking creation failed: ${error.message}` },
        { status: 500 }
      );
    }

    // ── 4. Update wallets (Platform & Gym) ────────────────────────────────
    try {
      await query(
        `UPDATE wallet SET balance = balance + $1, updated_at = NOW() WHERE id = 'platform_wallet'`,
        [Number(amount)]
      );

      // ── 4.1 Deduct from User Wallet if used ─────────────────────────────
      if (body.useWallet && finalUserId) {
        // Get wallet config for max usable
        const configRes = await query(
          `SELECT value FROM platform_config WHERE key = 'max_wallet_per_transaction'`
        );
        const maxUsable = parseFloat(configRes.rows[0]?.value || '10');

        // Deduct from user
        await query(
          'UPDATE users SET wallet_balance = COALESCE(wallet_balance, 0) - $1 WHERE id::text = $2::text',
          [maxUsable, finalUserId]
        );

        // Record the transaction
        await query(
          `INSERT INTO referral_transactions (referrer_id, referred_user_email, type, amount, status)
           VALUES ($1, $2, 'user', $3, 'debited')`,
          [finalUserId, customerEmail, maxUsable]
        );
        
        console.log(`[Wallet] Deducted ₹${maxUsable} from user ${finalUserId} for booking ${bookingId}`);
      }
    } catch (e) {
      console.error("Wallet update error", e);
    }

    // ── 5. Credit Referral Bonus ──────────────────────────────────────────
    try {
      if (finalUserId) {
        // Fetch user data directly from Postgres
        const userRes = await query(
          'SELECT id, email, wallet_balance, referred_by FROM users WHERE id = $1',
          [finalUserId]
        );
        
        const dbUser = userRes.rows[0];

        if (dbUser && dbUser.referred_by) {
          const referredBy = dbUser.referred_by;
          
          // Check if this is the user's first subscription ever
          const bookingCheck = await query(
            'SELECT COUNT(*) as count FROM bookings WHERE user_id = $1',
            [dbUser.id]
          );
          
          const bookingCount = parseInt(bookingCheck.rows[0]?.count || '0');
          console.log(`[Referral] Checking bonus for ${customerEmail}. ReferredBy: ${referredBy}, BookingCount: ${bookingCount}`);

          // Only credit on first purchase
          if (bookingCount <= 1) {
            // Find the referrer
            const referrerRes = await query(
              'SELECT id, email FROM users WHERE referral_code ILIKE $1',
              [referredBy]
            );

            if (referrerRes.rows.length > 0) {
              const referrer = referrerRes.rows[0];
              
              // Get configuration for bonus amount
              const configRes = await query(
                "SELECT value FROM platform_config WHERE key = 'refer_a_friend'"
              );
              const bonusAmount = parseFloat(configRes.rows[0]?.value || '50');

              console.log(`[Referral] Crediting ₹${bonusAmount} to referrer ${referrer.email}`);

              // 1. Credit the referrer's wallet
              await query(
                'UPDATE users SET wallet_balance = COALESCE(wallet_balance, 0) + $1 WHERE id = $2',
                [bonusAmount, referrer.id]
              );

              // 2. Record the transaction
              await query(
                `INSERT INTO referral_transactions (referrer_id, referred_user_email, type, amount, status)
                 VALUES ($1, $2, 'credit', $3, 'credited')`,
                [referrer.id, customerEmail, bonusAmount]
              );

              console.log(`[Referral] Successfully credited bonus for ${customerEmail}`);
            }
          }
        }
      }
    } catch (err: any) {
      console.error("[Referral] Bonus Error:", err);
    }


    // ── 4. Send Confirmation Email ────────────────────────────────────────
    try {
      const fullBookingRes = await query(
        `SELECT b.*, json_build_object('name', g.name, 'location', g.location) as gyms
         FROM bookings b LEFT JOIN gyms g ON b.gym_id = g.id WHERE b.id = $1`,
        [bookingId]
      );
      
      if (fullBookingRes.rows.length > 0) {
        await sendBookingConfirmationEmail(fullBookingRes.rows[0]);
      }
    } catch (emailErr) {
      console.error("[Email] confirmation email failed:", emailErr);
    }

    // ── 5. Revalidate Paths ───────────────────────────────────────────────
    try {
      revalidatePath("/admin/dashboard");
      revalidatePath("/admin/users");
      revalidatePath("/admin/gyms");
      revalidatePath("/partner/dashboard");
      revalidatePath("/explore");
    } catch (revalidateErr) {
      console.warn("Revalidation failed after payment, but booking is saved:", revalidateErr);
    }

    return NextResponse.json({
      success: true,
      bookingId: bookingId,
      paymentId: razorpay_payment_id,
      endDate: endDate.toISOString(),
    });
  } catch (error: any) {
    console.error("[Razorpay] verify error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
