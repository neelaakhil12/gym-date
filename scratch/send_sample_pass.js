const nodemailer = require("nodemailer");
const QRCode = require("qrcode");
require('dotenv').config({ path: '.env.local' });

async function sendPass() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false, 
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const booking = {
    id: "43af27ef-1234-5678-90ab-cdef12345678",
    customer_name: "NEELA AKHIL HARISH",
    customer_email: "neelaakhilharish@gmail.com",
    plan_name: "MONTHLY PASS",
    amount: "499",
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    gyms: {
      name: "National Gym",
      location: "https://maps.app.goo.gl/CcM67HvSfe7L9rqf6",
      address: "Kukatpally, Hyderabad"
    }
  };

  const shortId = (booking.id ? String(booking.id).slice(0, 8) : "PASS").toUpperCase();
  const publicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(booking.id)}&margin=1`;
  const gymLocationUrl = booking.gyms.location;
  const formattedStart = new Date(booking.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const formattedEnd = new Date(booking.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const mailOptions = {
    from: process.env.SMTP_FROM || `"GymDate" <${process.env.SMTP_USER}>`,
    to: booking.customer_email,
    subject: `🎟️ Your Entry Pass: ${booking.gyms.name} — GymDate`,
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
                  <h2 style="font-size: 20px; font-weight: 900; margin: 0 0 4px 0; color: #ffffff; letter-spacing: -0.3px;">${booking.gyms.name}</h2>
                  <p style="font-size: 12px; color: #94a3b8; margin: 0;">📍 ${booking.gyms.location}</p>
                </td>
                <td style="vertical-align: top; text-align: right; white-space: nowrap;">
                  <span style="background-color: #e50914; color: #ffffff; font-size: 11px; font-weight: 900; padding: 5px 12px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block;">
                    ${booking.plan_name}
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
                <td style="padding: 6px 0; color: #0f172a; font-weight: 800; text-align: right;">${booking.customer_name}</td>
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
  console.log("Pass sent successfully! MessageId:", info.messageId);
}

sendPass().catch(console.error);
