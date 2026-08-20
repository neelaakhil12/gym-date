import nodemailer from "nodemailer";
import QRCode from "qrcode";

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

    // 1. Generate QR Code as Buffer and Data URL
    const ticketValue = String(booking.ticket_code || booking.id || "PASS").trim();
    const qrBuffer = await QRCode.toBuffer(ticketValue, {
      width: 280,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    // 2. Prepare Email Content
    const gymLocationUrl = booking.gyms?.location?.startsWith("http") 
      ? booking.gyms.location 
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((booking.gyms?.name || "Gym") + " " + (booking.gyms?.address || ""))}`;

    const formattedStart = new Date(booking.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const formattedEnd = new Date(booking.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const ticketIdDisplay = (booking.ticket_code || booking.id.substring(0, 8)).toUpperCase();

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

            <!-- Middle Section: High-Res Access QR Code -->
            <div style="padding: 32px 24px; text-align: center; background-color: #ffffff; border-bottom: 2px dashed #f1f5f9;">
              <div style="display: inline-block; padding: 14px; background: #ffffff; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; margin-bottom: 16px;">
                <img src="cid:passqrcode" alt="Access QR Code" width="190" height="190" style="width: 190px; height: 190px; display: block; border-radius: 8px; margin: 0 auto;" />
              </div>
              
              <div>
                <p style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; margin: 0 0 2px 0;">Ticket ID</p>
                <p style="font-size: 16px; font-weight: 900; color: #0f172a; font-family: monospace; letter-spacing: 1px; margin: 0 0 12px 0;">${ticketIdDisplay}</p>
              </div>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px 16px; display: inline-block;">
                <p style="font-size: 11px; font-weight: 700; color: #475569; margin: 0;">Show this QR code to the gym staff for check-in</p>
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
            <p style="font-size: 11px; color: #94a3b8; margin: 0 0 4px 0;">This digital pass is securely linked to your account on <a href="https://gymdate.in" style="color: #e50914; text-decoration: none; font-weight: bold;">gymdate.in</a>.</p>
            <p style="font-size: 11px; color: #cbd5e1; margin: 0;">GymDate Technologies • All rights reserved</p>
          </div>

        </div>
      `,
      attachments: [
        {
          filename: 'pass-qrcode.png',
          content: qrBuffer,
          contentType: 'image/png',
          cid: 'passqrcode',
          contentDisposition: 'inline'
        }
      ]
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
            <h1 style="color: #e50914; margin: 0; font-size: 32px; font-weight: 900;">GymDate</h1>
            <p style="color: #666; font-size: 14px; margin-top: 5px; text-transform: uppercase; tracking-widest: 0.1em;">Partner Portal</p>
          </div>

          <h2 style="color: #333; font-size: 24px; font-weight: 800; margin-bottom: 20px;">
            Hello ${lead.owner_name},
          </h2>

          ${isApproved ? `
            <p style="font-size: 16px;">We are thrilled to inform you that your application to partner with <strong>GymDate</strong> for <strong>${lead.gym_name}</strong> has been <strong>Approved</strong>! 🎊</p>
            
            <div style="background: #fdf2f2; border-left: 4px solid #e50914; padding: 20px; border-radius: 12px; margin: 25px 0;">
              <h3 style="margin-top: 0; color: #e50914; font-size: 18px;">What's Next?</h3>
              <p style="margin-bottom: 0; font-size: 14px;">Our onboarding team will reach out to you within the next 24 hours to set up your digital dashboard, list your gym on our platform, and help you welcome your first GymDate members.</p>
            </div>

            <p style="font-size: 16px;">Welcome to India's fastest-growing fitness network. We look forward to a successful partnership!</p>
          ` : `
            <p style="font-size: 16px;">Thank you for your interest in partnering with <strong>GymDate</strong> for <strong>${lead.gym_name}</strong>.</p>
            
            <p style="font-size: 16px; color: #666;">After carefully reviewing your application and our current network requirements in <strong>${lead.city}</strong>, we are unable to proceed with your partnership at this moment.</p>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 12px; margin: 25px 0;">
              <p style="margin: 0; font-size: 14px; color: #666;">Don't worry! We've kept your details in our database. As we expand our reach, we may reach out to you in the future when new opportunities arise in your area.</p>
            </div>

            <p style="font-size: 16px;">We wish you the very best for your business.</p>
          `}

          <div style="border-top: 1px solid #eee; margin-top: 40px; pt-30px; text-align: center;">
            <p style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">Team GymDate</p>
            <p style="font-size: 12px; color: #999;">
              If you have any questions, feel free to reply to this email or contact us at 
              <a href="mailto:founder@gymdate.in" style="color: #e50914; text-decoration: none;">founder@gymdate.in</a>
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Partner lead ${status} email sent to ${lead.email}: %s`, info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending partner lead email:", error);
    return false;
  }
}
