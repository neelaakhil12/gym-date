import nodemailer from "nodemailer";
import QRCode from "qrcode";
import { query } from "@/lib/db";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendBookingConfirmationEmail(booking: any) {
  try {
    const targetEmail = booking.customer_email || booking.email || booking.user_email;
    if (!targetEmail) {
      console.warn("[Email] No recipient email found for booking confirmation:", booking);
      return false;
    }

    console.log(`[Email] Generating QR Code and sending confirmation to ${targetEmail}...`);

    // 1. Uniform Ticket ID (Match exactly with Account Dashboard: #E94FD64E)
    const shortId = (booking.id ? String(booking.id).slice(0, 8) : "PASS").toUpperCase();
    const qrValue = booking.id ? String(booking.id) : shortId;

    // Generate Base64 Data URL for database storage
    const qrDataUrl = await QRCode.toDataURL(qrValue, {
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    // 2. Ensure bookings_extra table exists and store QR code in database
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS bookings_extra (
          booking_id VARCHAR(255) PRIMARY KEY,
          ticket_code VARCHAR(50),
          qr_code TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      if (booking.id) {
        await query(`
          INSERT INTO bookings_extra (booking_id, ticket_code, qr_code, created_at)
          VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
          ON CONFLICT (booking_id) 
          DO UPDATE SET ticket_code = EXCLUDED.ticket_code, qr_code = EXCLUDED.qr_code
        `, [String(booking.id), shortId, qrDataUrl]);
        console.log(`[Email & DB] Successfully saved QR code in database for booking ${booking.id}`);
      }
    } catch (dbErr) {
      console.error("[Email & DB] Error saving QR code to bookings_extra table:", dbErr);
    }

    // 3. Prepare Email Content & Globally Compatible Image Source
    // Google proxy & mobile email clients reliably render standard HTTPS image URLs
    const publicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrValue)}&margin=1`;

    const gymLocationUrl = booking.gyms?.location?.startsWith("http") 
      ? booking.gyms.location 
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((booking.gyms?.name || "Gym") + " " + (booking.gyms?.address || ""))}`;

    const formattedStart = new Date(booking.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const formattedEnd = new Date(booking.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    const mailOptions = {
      from: process.env.SMTP_FROM || `"GymDate" <${process.env.SMTP_USER}>`,
      to: targetEmail,
      subject: `🎟️ Your Entry Pass: ${booking.gyms?.name || "Gym"} — GymDate`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; background-color: #f8fafc; padding: 24px 16px;">
          
          <!-- Brand Header -->
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #e50914; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">GymDate</h1>
            <p style="color: #64748b; font-size: 11px; margin: 2px 0 0 0; text-transform: uppercase; font-weight: 700; letter-spacing: 2px;">Official Membership Pass</p>
          </div>

          <!-- Digital Pass Ticket Card -->
          <div style="background-color: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04); border: 1px solid #f1f5f9;">
            
            <!-- Dark Top Section: Gym Info & Plan Badge -->
            <div style="background-color: #0f172a; padding: 24px 22px; color: #ffffff;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="vertical-align: top;">
                    <h2 style="font-size: 20px; font-weight: 900; margin: 0 0 4px 0; color: #ffffff; letter-spacing: -0.3px;">${booking.gyms?.name || "Partner Gym"}</h2>
                    <p style="font-size: 12px; color: #94a3b8; margin: 0;">📍 ${booking.gyms?.location || "Partner Location"}</p>
                  </td>
                  <td style="vertical-align: top; text-align: right; white-space: nowrap;">
                    <span style="background-color: #e50914; color: #ffffff; font-size: 11px; font-weight: 900; padding: 5px 12px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block;">
                      ${booking.plan_name || "Subscription"}
                    </span>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Middle Section: Guaranteed Display QR Code -->
            <div style="padding: 32px 24px; text-align: center; background-color: #ffffff; border-bottom: 2px dashed #f1f5f9;">
              <div style="display: inline-block; padding: 16px; background-color: #ffffff; border-radius: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; margin-bottom: 16px; line-height: 0;">
                <img src="${publicQrUrl}" alt="Access QR Code: ${shortId}" width="180" height="180" style="width: 180px; height: 180px; display: block; border-radius: 8px; margin: 0 auto; background-color: #ffffff;" />
              </div>
              
              <div>
                <p style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; margin: 0 0 2px 0;">Ticket ID</p>
                <p style="font-size: 18px; font-weight: 900; color: #0f172a; font-family: monospace; letter-spacing: 1px; margin: 0 0 12px 0;">${shortId}</p>
              </div>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px 16px; display: inline-block;">
                <p style="font-size: 11px; font-weight: 700; color: #475569; margin: 0;">#${shortId}</p>
              </div>
            </div>

            <!-- Validity & Member Details -->
            <div style="padding: 20px 24px; background-color: #fafafa;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Member Name:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-weight: 800; text-align: right;">${booking.customer_name || "Member"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Validity Period:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-weight: 800; text-align: right;">${formattedStart} – ${formattedEnd}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Amount Paid:</td>
                  <td style="padding: 6px 0; color: #16a34a; font-weight: 900; text-align: right; font-size: 14px;">₹${booking.amount}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Status:</td>
                  <td style="padding: 6px 0; color: #16a34a; font-weight: 900; text-align: right; text-transform: uppercase;">● ACTIVE</td>
                </tr>
              </table>
            </div>

            <!-- Google Maps 1-Click Button -->
            <div style="padding: 20px 24px 28px 24px; text-align: center; background-color: #ffffff;">
              <a href="${gymLocationUrl}" target="_blank" rel="noopener noreferrer" style="background-color: #e50914; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; padding: 14px 28px; border-radius: 16px; display: block; box-shadow: 0 4px 12px rgba(229, 9, 20, 0.25); letter-spacing: 0.2px;">
                📍 Open Gym in Google Maps ➔
              </a>
            </div>

          </div>

          <!-- Footer -->
          <div style="margin-top: 24px; text-align: center;">
            <p style="font-size: 11px; color: #94a3b8; margin: 0 0 4px 0;">This digital pass is securely stored in your account on <a href="https://gymdate.in" style="color: #e50914; text-decoration: none; font-weight: bold;">gymdate.in</a>.</p>
            <p style="font-size: 11px; color: #cbd5e1; margin: 0;">GymDate Technologies • All rights reserved</p>
          </div>

        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Confirmation email sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    return false;
  }
}

export async function sendPartnerLeadStatusEmail(lead: any, status: 'approved' | 'rejected') {
  try {
    const isApproved = status === 'approved';
    
    const mailOptions = {
      from: `"GymDate Partnership" <${process.env.SMTP_USER}>`,
      to: lead.email,
      subject: isApproved 
        ? `Congratulations! Your Partnership with GymDate is Approved 🎉`
        : `Update regarding your GymDate Partnership Application`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #f0f0f0; padding: 40px; border-radius: 24px; color: #1a1a1a; line-height: 1.6;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #e50914; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1px;">GymDate</h1>
            <p style="color: #666; font-size: 14px; margin-top: 5px;">Partner Network</p>
          </div>
          
          <h2 style="color: #111; font-size: 22px; font-weight: 700; margin-bottom: 15px;">
            ${isApproved ? 'Welcome to the GymDate Family! 🚀' : 'Partnership Application Status'}
          </h2>
          
          <p style="font-size: 16px; color: #444;">Dear <b>${lead.owner_name || lead.name || 'Partner'}</b>,</p>
          
          ${isApproved ? `
            <p style="font-size: 15px; color: #444;">
              We are thrilled to inform you that your partnership application for <b>${lead.gym_name || lead.name || 'your gym'}</b> has been officially <b>APPROVED</b>!
            </p>
            <p style="font-size: 15px; color: #444;">
              Your gym profile is now set up and being listed on our platform. You can now start receiving bookings and members through GymDate.
            </p>
            <div style="background-color: #f8fafc; border-left: 4px solid #16a34a; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; font-size: 14px; color: #334155;">
                <b>Next Steps:</b> Our team will assist you with onboarding your staff and setting up the QR scanner at your facility.
              </p>
            </div>
            <div style="text-align: center; margin-top: 35px;">
              <a href="https://gymdate.in/partner/login" style="background-color: #e50914; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; display: inline-block;">
                Access Partner Portal ➔
              </a>
            </div>
          ` : `
            <p style="font-size: 15px; color: #444;">
              Thank you for your interest in partnering with GymDate for <b>${lead.gym_name || lead.name || 'your gym'}</b>.
            </p>
            <p style="font-size: 15px; color: #444;">
              After carefully reviewing your application, we regret to inform you that we cannot approve your partnership request at this time.
            </p>
            <div style="background-color: #f8fafc; border-left: 4px solid #e50914; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; font-size: 14px; color: #334155;">
                If you have any questions or would like to provide additional details regarding your gym, please feel free to reach out to our team at <a href="mailto:support@gymdate.in" style="color: #e50914; text-decoration: underline;">support@gymdate.in</a>.
              </p>
            </div>
          `}
          
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 35px 0 20px 0;" />
          <p style="font-size: 12px; color: #888; text-align: center; margin: 0;">
            GymDate Technologies Inc. • Helping gyms grow and athletes connect.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Partner status email sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending partner status email:", error);
    return false;
  }
}
