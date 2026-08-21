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

    // ── 4. Insert booking into Postgres dynamically based on columns ───────────────────────────────────
    let bookingId;
    try {
      console.log("[Postgres] Attempting to insert booking:", {
        finalUserId, gymId, planName, amount, razorpay_payment_id, razorpay_order_id, today, endDate
      });

      // Inspect available columns in bookings table
      const colsRes = await query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'bookings'
      `);
      const bookingCols = new Set((colsRes.rows || []).map((r: any) => r.column_name.toLowerCase()));

      const insertFields: string[] = [];
      const insertValues: any[] = [];
      const placeholders: string[] = [];

      const addField = (col: string, val: any) => {
        if (bookingCols.has(col.toLowerCase())) {
          insertFields.push(col);
          insertValues.push(val);
          placeholders.push(`$${insertValues.length}`);
        }
      };

      addField('user_id', finalUserId || null);
      addField('gym_id', gymId);
      addField('customer_name', customerName);
      addField('customer_email', customerEmail);
      addField('user_email', customerEmail);
      addField('email', customerEmail);
      addField('plan_name', planName);
      addField('amount', Number(amount));
      addField('status', 'completed');
      addField('payment_id', razorpay_payment_id);
      addField('razorpay_order_id', razorpay_order_id);
      addField('ticket_code', ticketCode);
      addField('start_date', today.toISOString());
      addField('end_date', endDate.toISOString());

      const insertQuery = `
        INSERT INTO bookings (${insertFields.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING id
      `;

      const bookingRes = await query(insertQuery, insertValues);
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
          `SELECT value FROM platform_config WHERE key IN ('max_wallet_per_txn', 'max_wallet_per_transaction')`
        );
        const maxAllowed = parseFloat(configRes.rows[0]?.value || '10');

        // Fetch user's current wallet balance
        const userWalletRes = await query('SELECT wallet_balance FROM users_extra WHERE user_id::text = $1::text', [finalUserId]);
        const currentBalance = parseFloat(userWalletRes.rows[0]?.wallet_balance || '0');
        const amountToDeduct = Math.min(currentBalance, maxAllowed);

        if (amountToDeduct > 0) {
          // Deduct from user wallet in users_extra
          await query(
            'UPDATE users_extra SET wallet_balance = GREATEST(0, COALESCE(wallet_balance, 0) - $1), updated_at = CURRENT_TIMESTAMP WHERE user_id::text = $2::text',
            [amountToDeduct, finalUserId]
          );

          // Record the wallet debit transaction
          await query(
            `INSERT INTO referral_transactions (referrer_id, referred_user_email, type, amount, status)
             VALUES ($1, $2, 'debit', $3, 'debited')`,
            [finalUserId, `Wallet Used for ${planName || 'Subscription'}`, amountToDeduct]
          );
          
          console.log(`[Wallet] Deducted ₹${amountToDeduct} from user ${finalUserId} for booking ${bookingId}`);
        }
      }
    } catch (e) {
      console.error("Wallet update error", e);
    }

    // ── 5. Credit Referral Bonus ──────────────────────────────────────────
    try {
      if (finalUserId) {
        // Fetch user data with referred_by from users_extra
        const userRes = await query(
          `SELECT u.id, u.email, ue.referred_by
           FROM users u
           LEFT JOIN users_extra ue ON u.id = ue.user_id
           WHERE u.id::text = $1::text`,
          [finalUserId]
        );
        
        const dbUser = userRes.rows[0];

        if (dbUser && dbUser.referred_by) {
          const referredBy = dbUser.referred_by;
          
          // Check if this is the user's first subscription ever
          const bookingCheck = await query(
            'SELECT COUNT(*) as count FROM bookings WHERE user_id::text = $1::text',
            [dbUser.id]
          );
          
          const bookingCount = parseInt(bookingCheck.rows[0]?.count || '0');
          console.log(`[Referral] Checking bonus for ${customerEmail}. ReferredBy: ${referredBy}, BookingCount: ${bookingCount}`);

          // Check if referral was already credited upon login / previously
          const existingCredit = await query(
            'SELECT id FROM referral_transactions WHERE LOWER(referred_user_email) = $1 AND type = $2',
            [customerEmail.trim().toLowerCase(), 'user']
          );

          // Only credit if never credited before
          if (bookingCount <= 1 && existingCredit.rows.length === 0) {
            // Find the referrer in users_extra
            const referrerRes = await query(
              `SELECT u.id, u.email, u.role_id, ue.referral_code
               FROM users u
               JOIN users_extra ue ON u.id = ue.user_id
               WHERE TRIM(UPPER(ue.referral_code)) = TRIM(UPPER($1))`,
              [referredBy]
            );

            if (referrerRes.rows.length > 0) {
              const referrer = referrerRes.rows[0];
              
              // Get configuration for bonus amounts (user and partner)
              const configRes = await query(
                "SELECT key, value FROM platform_config WHERE key IN ('user_referral_bonus', 'refer_a_friend', 'partner_referral_bonus')"
              );
              const configMap: Record<string, string> = {};
              configRes.rows.forEach((r: any) => { configMap[r.key] = r.value; });
              const userBonus = parseFloat(configMap['user_referral_bonus'] || configMap['refer_a_friend'] || '10');
              const partnerBonus = parseFloat(configMap['partner_referral_bonus'] || '500');

              const isPartnerReferrer = referrer?.role_id === 'partner';
              
              let bonusAmount = userBonus;
              if (isPartnerReferrer) {
                const gymRes = await query('SELECT partner_referral_amount FROM gyms WHERE partner_id::text = $1::text LIMIT 1', [referrer.id]);
                if (gymRes.rows.length > 0 && gymRes.rows[0].partner_referral_amount) {
                  bonusAmount = parseFloat(gymRes.rows[0].partner_referral_amount);
                } else {
                  bonusAmount = partnerBonus;
                }
              }

              console.log(`[Referral] Crediting ₹${bonusAmount} to referrer ${referrer.email}`);

              // 1. Credit the referrer's wallet in users_extra
              await query(
                `INSERT INTO users_extra (user_id, wallet_balance, updated_at)
                 VALUES ($1, $2, CURRENT_TIMESTAMP)
                 ON CONFLICT (user_id) 
                 DO UPDATE SET wallet_balance = COALESCE(users_extra.wallet_balance, 0) + $2, updated_at = CURRENT_TIMESTAMP`,
                [referrer.id, bonusAmount]
              );

              // 2. Record the transaction
              await query(
                `INSERT INTO referral_transactions (referrer_id, referred_user_email, type, amount, status)
                 VALUES ($1, $2, 'user', $3, 'credited')`,
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


    // ── 4. Send Confirmation Email with QR Code & Gym Location ────────────────────────────────────────
    try {
      const fullBookingRes = await query(
        `SELECT b.*, 
                json_build_object(
                  'name', COALESCE(g.name, 'Gym Partner'), 
                  'location', COALESCE(g.location, 'https://maps.google.com')
                ) as gyms
         FROM bookings b 
         LEFT JOIN gyms g ON b.gym_id::text = g.id::text 
         WHERE b.id::text = $1::text`,
        [String(bookingId)]
      );
      
      const gymData = fullBookingRes.rows[0]?.gyms || { name: 'Gym Partner', location: 'https://maps.google.com' };
      const bookingData = {
        id: bookingId,
        ticket_code: ticketCode,
        customer_name: customerName || 'Member',
        customer_email: customerEmail,
        plan_name: planName,
        amount: amount,
        start_date: today.toISOString(),
        end_date: endDate.toISOString(),
        gyms: gymData
      };
      
      // Store in database qr_codes table
      try {
        await query(
          `INSERT INTO qr_codes (booking_id, ticket_code, qr_data)
           VALUES ($1, $2, $3)`,
          [String(bookingId), String(ticketCode), String(bookingId)]
        );
        console.log(`[Database] Stored QR code entry for booking ${bookingId}`);
      } catch (dbQrErr) {
        console.warn("[Database] QR codes table insert warning:", dbQrErr);
      }

      console.log(`[Email] Triggering confirmation email for ${customerEmail}...`);
      await sendBookingConfirmationEmail(bookingData);
      console.log(`[Email] Confirmation email sent successfully to ${customerEmail}`);
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
