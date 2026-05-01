"use server";

import nodemailer from "nodemailer";
import { query } from "@/lib/db";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log("SMTP Verify Error:", error);
  } else {
    console.log("SMTP Server is ready to take our messages");
  }
});

import crypto from "crypto";

export async function sendPasswordResetEmail(email: string, redirectTo: string = "/partner/reset-password") {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://gymdate.in');

    // 1. Check if user exists
    const userResult = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (userResult.rows.length === 0) {
      // For security, don't reveal if user exists. Just say "If your email is in our system..."
      return { success: true, message: "If your email is registered, you will receive a reset link shortly." };
    }

    // 2. Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    // 3. Save to DB
    await query(
      "INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, $3) ON CONFLICT (email, token) DO UPDATE SET expires_at = $3",
      [email, token, expiresAt]
    );

    // 4. Send Email
    const resetLink = `${siteUrl}${redirectTo}?token=${token}&email=${encodeURIComponent(email)}`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: `Reset Your GymDate Password`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #ef4444; text-align: center;">Reset Your Password</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password for your GymDate account.</p>
          <p>Click the button below to set a new password. This link will expire in 1 hour.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
          </div>
          
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p style="font-size: 12px; color: #999;">If the button doesn't work, copy and paste this link: <br> ${resetLink}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666; text-align: center;">&copy; 2026 GymDate Platform. All rights reserved.</p>
        </div>
      `,
    });

    return { success: true, message: "Reset link sent! Please check your email." };
  } catch (err: any) {
    console.error("SMTP error:", err);
    return { error: "Failed to send reset link. Please check your SMTP settings." };
  }
}

export async function sendPartnerWelcomeEmail(email: string, gymName: string, password: string) {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: `Welcome to GymDate - Your Partner Dashboard is Ready!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #ef4444; text-align: center;">Welcome to GymDate</h2>
          <p>Hello,</p>
          <p>Congratulations! <strong>${gymName}</strong> is now live on the GymDate platform.</p>
          <p>We've created a Partner account for you so you can manage your gym listing, track bookings, and view your revenue.</p>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin-top: 0;"><strong>Your Login Credentials:</strong></p>
            <p style="margin-bottom: 5px;"><strong>Email:</strong> ${email}</p>
            <p style="margin-bottom: 0;"><strong>Password:</strong> ${password}</p>
          </div>

          <p>You can log in to your dashboard here:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${siteUrl}/partner/login" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Login to Partner Dashboard</a>
          </div>
          
          <p>Please make sure to change your password after your first login.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666; text-align: center;">&copy; 2026 GymDate Platform. All rights reserved.</p>
        </div>
      `,
    });

    console.log("Welcome email sent:", info.messageId);
    return { success: true };
  } catch (err: any) {
    console.error("Email error:", err);
    return { error: "Failed to send welcome email." };
  }
}
