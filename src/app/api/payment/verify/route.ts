import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { computeEndDate } from "@/lib/planDuration";

// Use service-role key so we can INSERT bookings bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      // booking metadata
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
    // Use user-selected start date if provided, otherwise today
    const today = startDate ? new Date(startDate) : new Date();
    today.setHours(0, 0, 0, 0); // normalize to start of day
    const endDate = computeEndDate(today, planName || "");
    const ticketCode = `GD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // ── 3. Find or Create Profile ────────────────────────────────────────
    let finalUserId = userId;
    if (!finalUserId && customerEmail) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', customerEmail)
        .single();
      
      if (profile) {
        finalUserId = profile.id;
      } else {
        // Create a new profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabaseAdmin
          .from('profiles')
          .insert({
            email: customerEmail,
            full_name: customerName,
            phone: customerPhone,
            role_id: 'user'
          })
          .select('id')
          .single();
        
        if (!createError && newProfile) {
          finalUserId = newProfile.id;
        }
      }
    }

    // ── 4. Insert booking into Supabase ───────────────────────────────────
    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .insert({
        user_id: finalUserId || null,
        gym_id: gymId,
        plan_name: planName,
        amount: Number(amount),
        status: "completed",
        payment_id: razorpay_payment_id,
        razorpay_order_id: razorpay_order_id,
        start_date: today.toISOString(),
        end_date: endDate.toISOString(),
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        ticket_code: ticketCode,
      })
      .select()
      .single();

    if (error) {
      // If the column doesn't exist yet we still return success — booking table may be missing new cols
      console.error("[Supabase] booking insert error:", error);
      // Insert without new columns as fallback
      const { data: bookingFallback, error: fallbackError } = await supabaseAdmin
        .from("bookings")
        .insert({
          user_id: finalUserId || null,
          gym_id: gymId,
          plan_name: planName,
          amount: Number(amount),
          status: "completed",
          start_date: today.toISOString(),
          end_date: endDate.toISOString(),
        })
        .select()
        .single();

      if (fallbackError) {
        console.error("[Supabase] fallback insert error:", fallbackError);
        return NextResponse.json(
          { error: "Payment verified but booking creation failed" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        bookingId: bookingFallback?.id,
        paymentId: razorpay_payment_id,
        endDate: endDate.toISOString(),
      });
    }

    // ── 4. Update wallets (Platform & Gym) ────────────────────────────────
    // A. Platform Wallet (Total Gross)
    const { data: platformWallet } = await supabaseAdmin
      .from("wallet")
      .select("balance")
      .eq("id", "platform_wallet")
      .single();

    if (platformWallet) {
      await supabaseAdmin
        .from("wallet")
        .update({
          balance: Number(platformWallet.balance) + Number(amount),
          updated_at: new Date().toISOString(),
        })
        .eq("id", "platform_wallet");
    }

    // B. Gym Wallet (Net after commission)
    // Fetch gym to get commission rate
    const { data: gymData } = await supabaseAdmin
      .from("gyms")
      .select("commission_rate")
      .eq("id", gymId)
      .single();

    const commissionRate = gymData?.commission_rate || 10;
    const netAmount = Number(amount) * (1 - commissionRate / 100);

    // Try to get existing gym wallet
    const { data: gymWallet } = await supabaseAdmin
      .from("wallets")
      .select("balance")
      .eq("gym_id", gymId)
      .single();

    if (gymWallet) {
      await supabaseAdmin
        .from("wallets")
        .update({
          balance: Number(gymWallet.balance) + netAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("gym_id", gymId);
    } else {
      // Create wallet if it doesn't exist
      await supabaseAdmin
        .from("wallets")
        .insert({
          gym_id: gymId,
          balance: netAmount,
          updated_at: new Date().toISOString()
        });
    }

    // ── 4. Send Confirmation Email ────────────────────────────────────────
    try {
      const { data: fullBooking } = await supabaseAdmin
        .from('bookings')
        .select('*, gyms(name, location)')
        .eq('id', booking?.id || "")
        .single();
      
      if (fullBooking) {
        await sendBookingConfirmationEmail(fullBooking);
      }
    } catch (emailErr) {
      console.error("[Email] confirmation email failed:", emailErr);
    }

    return NextResponse.json({
      success: true,
      bookingId: booking?.id,
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
