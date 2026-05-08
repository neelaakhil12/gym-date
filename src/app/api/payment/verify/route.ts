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

    // ── 3. Find or Create Profile ────────────────────────────────────────
    let finalUserId = userId;
    if (!finalUserId && customerEmail) {
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
    } catch (e) {
      console.error("Wallet update error", e);
    }

    // ── 5. Credit Referral Bonus ──────────────────────────────────────────
    try {
      if (finalUserId) {
        // Check if this user was referred AND this is their first purchase
        const referralCheck = await query(
          `SELECT u.referred_by, (SELECT COUNT(*) FROM bookings WHERE user_id = $1) as booking_count
           FROM users u WHERE u.id = $1`,
          [finalUserId]
        );

        const referredBy = referralCheck.rows[0]?.referred_by;
        const bookingCount = parseInt(referralCheck.rows[0]?.booking_count || '0');

        // Only credit on first purchase and if they were referred
        if (referredBy && bookingCount <= 1) {
          // Find the referrer
          const referrerRes = await query(
            'SELECT id FROM users WHERE referral_code = $1',
            [referredBy]
          );

          if (referrerRes.rows.length > 0) {
            const referrerId = referrerRes.rows[0].id;

            // Get configured bonus amount and max referrals limit
            const configRes = await query(
              `SELECT key, value FROM platform_config WHERE key IN ('user_referral_bonus', 'max_referrals_allowed')`
            );
            const configMap: Record<string, string> = {};
            configRes.rows.forEach(r => configMap[r.key] = r.value);
            
            const bonusAmount = parseFloat(configMap['user_referral_bonus'] || '20');
            const maxAllowed = parseInt(configMap['max_referrals_allowed'] || '5');

            // Check how many successful referrals this referrer already has
            const currentCountRes = await query(
              `SELECT COUNT(*) as count FROM referral_transactions WHERE referrer_id::text = $1::text AND status = 'credited'`,
              [referrerId]
            );
            const currentCount = parseInt(currentCountRes.rows[0]?.count || '0');

            if (currentCount < maxAllowed) {
              // Credit wallet
              await query(
                'UPDATE users SET wallet_balance = COALESCE(wallet_balance, 0) + $1 WHERE id::text = $2::text',
                [bonusAmount, referrerId]
              );

              // Log transaction
              await query(
                `INSERT INTO referral_transactions (referrer_id, referred_user_email, type, amount, status)
                 VALUES ($1, $2, 'user', $3, 'credited')`,
                [referrerId, customerEmail, bonusAmount]
              );

              console.log(`[Referral] Credited ₹${bonusAmount} to referrer ${referrerId} for referring ${customerEmail} (Referral #${currentCount + 1}/${maxAllowed})`);
            } else {
              console.log(`[Referral] Referrer ${referrerId} reached limit of ${maxAllowed} referrals. No bonus credited.`);
            }
          }
        }
      }
    } catch (refErr) {
      console.error("[Referral] bonus credit failed:", refErr);
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
