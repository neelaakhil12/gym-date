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
});

export async function sendPasswordResetEmail(email: string, redirectTo: string = "/partner/reset-password") {
  try {
    // Note: Since we moved from Supabase Auth to custom Postgres auth, 
    // a real implementation needs a password_resets table to store a token.
    // For now, this is disabled.
    return { error: "Password reset is currently disabled in self-hosted mode. Please contact admin." };
  } catch (err: any) {
    console.error("SMTP error:", err);
    return { error: "Failed to send email. Please try again later." };
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
