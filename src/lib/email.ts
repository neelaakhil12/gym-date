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

    // 1. Generate QR Code as Data URL
    const qrDataUrl = await QRCode.toDataURL(booking.ticket_code || booking.id);
    
    // 2. Prepare Email Content
    const gymLocationUrl = booking.gyms?.location?.startsWith("http") 
      ? booking.gyms.location 
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((booking.gyms?.name || "Gym") + " " + (booking.gyms?.address || ""))}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || `"GymDate" <${process.env.SMTP_USER}>`,
      to: targetEmail,
      subject: `🎉 Booking Confirmed: ${booking.gyms?.name || "Gym"} — GymDate Pass`,
      html: `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #f0f0f0; padding: 40px 30px; border-radius: 24px; color: #1a1a1a; background-color: #ffffff; line-height: 1.6;">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #e50914; margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -0.5px;">GYMDATE</h1>
            <p style="color: #888; font-size: 12px; margin-top: 4px; text-transform: uppercase; font-weight: 700; letter-spacing: 2px;">Official Membership Pass</p>
          </div>

          <div style="background: linear-gradient(135deg, #fff5f5 0%, #ffffff 100%); border: 1px solid #fee2e2; border-radius: 18px; padding: 24px; text-align: center; margin-bottom: 30px;">
            <span style="background: #e50914; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px;">Payment Successful</span>
            <h2 style="color: #111827; font-size: 22px; font-weight: 800; margin: 12px 0 6px 0;">You're Ready to Workout!</h2>
            <p style="color: #4b5563; font-size: 14px; margin: 0;">Hi <strong>${booking.customer_name}</strong>, your pass for <strong>${booking.gyms?.name}</strong> is now active.</p>
          </div>
          
          <!-- Subscription Details Box -->
          <div style="background: #f9fafb; border: 1px solid #f3f4f6; padding: 20px 24px; border-radius: 16px; margin: 24px 0;">
            <h3 style="margin: 0 0 14px 0; font-size: 14px; font-weight: 800; color: #111827; text-transform: uppercase; letter-spacing: 0.5px;">Membership Summary</h3>
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #6b7280; font-weight: 600;">Gym:</td>
                <td style="padding: 6px 0; color: #111827; font-weight: 700; text-align: right;">${booking.gyms?.name}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280; font-weight: 600;">Plan:</td>
                <td style="padding: 6px 0; color: #111827; font-weight: 700; text-align: right;">${booking.plan_name}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280; font-weight: 600;">Amount Paid:</td>
                <td style="padding: 6px 0; color: #16a34a; font-weight: 800; text-align: right;">₹${booking.amount}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280; font-weight: 600;">Valid From:</td>
                <td style="padding: 6px 0; color: #111827; font-weight: 700; text-align: right;">${new Date(booking.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280; font-weight: 600;">Valid Until:</td>
                <td style="padding: 6px 0; color: #111827; font-weight: 700; text-align: right;">${new Date(booking.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280; font-weight: 600;">Ticket Code:</td>
                <td style="padding: 6px 0; color: #e50914; font-weight: 800; text-align: right; font-family: monospace; font-size: 15px;">${booking.ticket_code || booking.id}</td>
              </tr>
            </table>
          </div>

          <!-- QR Code Section -->
          <div style="text-align: center; margin: 35px 0; background: #ffffff; border: 2px dashed #e5e7eb; border-radius: 20px; padding: 30px 20px;">
            <p style="font-weight: 800; font-size: 15px; color: #111827; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px;">Entry Access QR Code</p>
            <p style="font-size: 12px; color: #6b7280; margin: 0 0 20px 0;">Show this QR Code at the gym desk for staff to scan and admit you.</p>
            <img src="cid:qrcode" alt="Access QR Code" style="width: 220px; height: 220px; border: 4px solid #111827; padding: 12px; border-radius: 16px; display: inline-block; background: #fff;" />
          </div>

          <!-- Gym Location / Directions -->
          <div style="text-align: center; margin: 30px 0; background: #fdf2f2; border-radius: 16px; padding: 24px;">
            <p style="font-weight: 800; font-size: 15px; color: #111827; margin: 0 0 6px 0;">📍 Gym Location & Directions</p>
            ${booking.gyms?.address ? `<p style="font-size: 13px; color: #4b5563; margin: 0 0 16px 0;">${booking.gyms.address}</p>` : `<p style="font-size: 13px; color: #4b5563; margin: 0 0 16px 0;">Get real-time driving directions directly to ${booking.gyms?.name}</p>`}
            <a href="${gymLocationUrl}" target="_blank" rel="noopener noreferrer" style="background: #e50914; color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(229, 9, 20, 0.25);">
              Open in Google Maps ➔
            </a>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #f3f4f6; margin-top: 35px; padding-top: 25px; text-align: center;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0 0 6px 0;">
              This is an automated confirmation for your GymDate subscription.
            </p>
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
              Need help? Reach us anytime at <a href="mailto:support@gymdate.in" style="color: #e50914; text-decoration: none; font-weight: bold;">support@gymdate.in</a> or visit <a href="https://gymdate.in" style="color: #e50914; text-decoration: none; font-weight: bold;">gymdate.in</a>.
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: 'qrcode.png',
          content: qrDataUrl.split("base64,")[1],
          encoding: 'base64',
          cid: 'qrcode' // same as in the img src above
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
