import { NextResponse } from "next/server";
import { otpCache } from "@/lib/otpCache";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, otp, name, phone } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Support demo code 123456 or verify against otpCache
    if (otp !== "123456") {
      const cachedData = otpCache.get(cleanEmail);
      if (!cachedData) {
        return NextResponse.json({ success: false, error: "No OTP found. Please request a new code." }, { status: 400 });
      }
      if (cachedData.otp !== otp) {
        return NextResponse.json({ success: false, error: "Invalid OTP code" }, { status: 400 });
      }
      if (Date.now() > cachedData.expires) {
        otpCache.delete(cleanEmail);
        return NextResponse.json({ success: false, error: "OTP has expired. Please request a new code." }, { status: 400 });
      }
      otpCache.delete(cleanEmail);
    }

    // OTP Verified! Sync user in database
    let userResult = await query("SELECT * FROM users WHERE email = $1", [cleanEmail]);

    if (userResult.rows.length === 0) {
      // Dynamically check columns on users table
      const userColsRes = await query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users'
      `);
      const userCols = new Set((userColsRes.rows || []).map((r: any) => r.column_name.toLowerCase()));

      const insertCols = ["email", "full_name", "role_id"];
      const insertVals: any[] = [cleanEmail, name || "Gym Member", "user"];

      if (phone && userCols.has("phone")) {
        insertVals.push(phone);
        insertCols.push("phone");
      }

      if (userCols.has("wallet_balance")) {
        const configRes = await query("SELECT value FROM platform_config WHERE key = 'signup_bonus'");
        const signupBonus = parseFloat(configRes.rows[0]?.value || '0');
        insertVals.push(signupBonus);
        insertCols.push("wallet_balance");
      }

      const placeholders = insertVals.map((_, i) => `$${i + 1}`).join(", ");
      userResult = await query(
        `INSERT INTO users (${insertCols.join(", ")}) VALUES (${placeholders}) RETURNING *`,
        insertVals
      );
    } else {
      if (name || phone) {
        await query(
          "UPDATE users SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone) WHERE email = $3",
          [name || null, phone || null, cleanEmail]
        );
      }
    }

    const user = userResult.rows[0];

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        address: user.address,
        role_id: user.role_id,
        wallet_balance: user.wallet_balance
      }
    });
  } catch (error: any) {
    console.error("OTP Verification Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to verify OTP" }, { status: 500 });
  }
}
