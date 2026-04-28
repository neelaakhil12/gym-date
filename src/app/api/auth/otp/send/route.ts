import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { otpCache } from "@/lib/otpCache";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // 1. Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Save to shared memory (valid for 5 minutes)
    otpCache.set(email, {
      otp,
      expires: Date.now() + (5 * 60 * 1000)
    });

    // 3. Setup Nodemailer using your Gmail credentials
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // 4. Send the 6-digit code
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: `Your GymDate Verification Code: ${otp}`,
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: auto; padding: 40px; border: 1px solid #eee; border-radius: 32px; text-align: center; background: #fff;">
          <h2 style="color: #FF0000; font-size: 28px; font-weight: 900; margin-bottom: 8px; letter-spacing: -1px;">Gym<span style="color: #000;">Date</span></h2>
          <p style="color: #666; font-size: 14px; margin-bottom: 32px;">Enter this code to securely log in to your account.</p>
          
          <div style="background: #f8f8f8; padding: 24px; border-radius: 20px; margin-bottom: 32px;">
            <span style="font-size: 42px; font-weight: 900; color: #000; letter-spacing: 12px; font-family: monospace;">${otp}</span>
          </div>

          <p style="color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Expires in 5 minutes</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: "OTP sent successfully!" });
  } catch (error: any) {
    console.error("OTP Send Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
