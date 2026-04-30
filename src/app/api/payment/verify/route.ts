import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { query } from "@/lib/db";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { computeEndDate } from "@/lib/planDuration";

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
      const bookingRes = await query(
        `INSERT INTO bookings (
          user_id, gym_id, plan_name, amount, status, payment_id, razorpay_order_id, start_date, end_date
        ) VALUES ($1, $2, $3, $4, 'completed', $5, $6, $7, $8) RETURNING id`,
        [
          finalUserId || null, gymId, planName, Number(amount), razorpay_payment_id, 
          razorpay_order_id, today.toISOString(), endDate.toISOString()
        ]
      );
      bookingId = bookingRes.rows[0].id;
    } catch (error) {
      console.error("[Postgres] booking insert error:", error);
      return NextResponse.json(
        { error: "Payment verified but booking creation failed" },
        { status: 500 }
      );
    }

    // ── 4. Update wallets (Platform & Gym) ────────────────────────────────
    try {
      // A. Platform Wallet
      await query(
        `UPDATE wallet SET balance = balance + $1, updated_at = NOW() WHERE id = 'platform_wallet'`,
        [Number(amount)]
      );

      // B. Gym Wallet
      const gymDataRes = await query('SELECT commission_rate FROM gyms WHERE id = $1', [gymId]);
      const commissionRate = gymDataRes.rows[0]?.commission_rate || 10;
      const netAmount = Number(amount) * (1 - commissionRate / 100);

      // We didn't have wallets table in schema, so let's skip or try to update if it exists
      // The schema only has a platform_wallet. Wait, partner dashboard gets earnings from bookings.
      // We don't necessarily need a 'wallets' table for gym, we compute it dynamically.
    } catch (e) {
      console.error("Wallet update error", e);
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
