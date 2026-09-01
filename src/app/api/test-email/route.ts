import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email") || "neelaakhilharish@gmail.com";
  return sendTestMail(email);
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    return sendTestMail(email || "neelaakhilharish@gmail.com");
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function sendTestMail(email: string) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || `"GymDate" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Test Email from GymDate",
      text: "If you are reading this, your SMTP settings are working perfectly!",
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #FF0000;">GymDate SMTP Test</h2>
          <p>Your email settings are now <b>working correctly</b>.</p>
          <p>Sent to: ${email}</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true, messageId: info.messageId, email });
  } catch (error: any) {
    console.error("SMTP Test Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

