import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Test Email from GymDate",
      text: "If you are reading this, your SMTP settings are working perfectly!",
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #FF0000;">GymDate SMTP Test</h2>
          <p>Your email settings are now <b>working correctly</b>.</p>
          <p>Sent from: ${process.env.SMTP_USER}</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: "Test email sent!" });
  } catch (error: any) {
    console.error("SMTP Test Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
