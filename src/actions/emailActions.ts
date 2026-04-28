"use server";

import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

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
    // 1. Generate the recovery link via Supabase Admin
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}${redirectTo}`
      }
    });

    if (linkError) {
      console.error("Link generation error:", linkError);
      return { error: "Could not find a user with this email." };
    }

    const resetLink = data.properties.action_link;
    const isAdmin = redirectTo.includes("admin");

    // 2. Send the email via Nodemailer (SMTP)
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: `Reset your GymDate ${isAdmin ? 'Admin' : ''} Password`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 10px;">
          <h2 style="color: ${isAdmin ? '#000000' : '#ef4444'}; text-align: center;">GymDate</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password for your GymDate ${isAdmin ? 'Admin' : 'Partner'} account.</p>
          <p>Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: ${isAdmin ? '#000000' : '#ef4444'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
          </div>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p>This link will expire soon.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666; text-align: center;">&copy; 2026 GymDate Platform. All rights reserved.</p>
        </div>
      `,
    });

    console.log("Email sent successfully:", info.messageId);
    return { success: true };
  } catch (err: any) {
    console.error("SMTP error:", err);
    return { error: "Failed to send email. Please try again later." };
  }
}
export async function sendPartnerWelcomeEmail(email: string, gymName: string, password: string) {
  try {
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
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/partner/login" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Login to Partner Dashboard</a>
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
