const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

async function run() {
  try {
    const bookingId = "a5c92682-9ecc-4ee6-9eea-864f210c81ef";
    const shortId = "A5C92682";
    const targetEmail = "neelaakhilharish@gmail.com";

    // 1. Generate QR codes
    const qrBuffer = await QRCode.toBuffer(bookingId, { width: 300, margin: 1 });
    const qrBase64 = qrBuffer.toString('base64');
    const qrDataUrl = `data:image/png;base64,${qrBase64}`;
    
    // Generate pure SVG string
    const qrSvg = await QRCode.toString(bookingId, {
      type: 'svg',
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    // 2. Save in bookings_extra table in database
    await pool.query(`
      INSERT INTO bookings_extra (booking_id, ticket_code, qr_code, created_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (booking_id) 
      DO UPDATE SET ticket_code = EXCLUDED.ticket_code, qr_code = EXCLUDED.qr_code
    `, [bookingId, shortId, qrDataUrl]);
    console.log("Successfully saved QR code in bookings_extra database table!");

    // 3. Prepare Email with multi-layer QR rendering
    // SVG wrapper without XML declaration for clean inline HTML
    const cleanSvg = qrSvg.replace(/<\?xml.*?\?>/, '');

    const mailOptions = {
      from: process.env.SMTP_FROM || `"GymDate" <${process.env.SMTP_USER}>`,
      to: targetEmail,
      subject: `🎟️ Your Entry Pass: national — GymDate`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; background-color: #f8fafc; padding: 24px 16px;">
          
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #e50914; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">GymDate</h1>
            <p style="color: #64748b; font-size: 11px; margin: 2px 0 0 0; text-transform: uppercase; font-weight: 700; letter-spacing: 2px;">Official Membership Pass</p>
          </div>

          <div style="background-color: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04); border: 1px solid #f1f5f9;">
            
            <div style="background-color: #0f172a; padding: 24px 22px; color: #ffffff;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="vertical-align: top;">
                    <h2 style="font-size: 20px; font-weight: 900; margin: 0 0 4px 0; color: #ffffff; letter-spacing: -0.3px;">national</h2>
                    <p style="font-size: 12px; color: #94a3b8; margin: 0;">📍 Partner Location</p>
                  </td>
                  <td style="vertical-align: top; text-align: right; white-space: nowrap;">
                    <span style="background-color: #e50914; color: #ffffff; font-size: 11px; font-weight: 900; padding: 5px 12px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block;">
                      MONTHLY
                    </span>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Middle Section: Guaranteed Display QR Code -->
            <div style="padding: 32px 24px; text-align: center; background-color: #ffffff; border-bottom: 2px dashed #f1f5f9;">
              <div style="display: inline-block; padding: 16px; background-color: #ffffff; border-radius: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; margin-bottom: 16px; line-height: 0;">
                <img src="cid:gymdatepassqr" alt="Access QR Code" width="180" height="180" style="width: 180px; height: 180px; display: block; border-radius: 8px; margin: 0 auto; background-color: #ffffff;" />
              </div>
              
              <div>
                <p style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; margin: 0 0 2px 0;">Ticket ID</p>
                <p style="font-size: 18px; font-weight: 900; color: #0f172a; font-family: monospace; letter-spacing: 1px; margin: 0 0 12px 0;">${shortId}</p>
              </div>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px 16px; display: inline-block;">
                <p style="font-size: 11px; font-weight: 700; color: #475569; margin: 0;">#${shortId}</p>
              </div>
            </div>

            <div style="padding: 20px 24px; background-color: #fafafa;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Member Name:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-weight: 800; text-align: right;">MEGHANA REDDY</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Amount Paid:</td>
                  <td style="padding: 6px 0; color: #16a34a; font-weight: 900; text-align: right; font-size: 14px;">₹1</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Status:</td>
                  <td style="padding: 6px 0; color: #16a34a; font-weight: 900; text-align: right; text-transform: uppercase;">● ACTIVE</td>
                </tr>
              </table>
            </div>

            <div style="padding: 20px 24px 28px 24px; text-align: center; background-color: #ffffff;">
              <a href="https://gymdate.in/account" target="_blank" rel="noopener noreferrer" style="background-color: #e50914; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; padding: 14px 28px; border-radius: 16px; display: block; box-shadow: 0 4px 12px rgba(229, 9, 20, 0.25); letter-spacing: 0.2px;">
                View Pass in Account ➔
              </a>
            </div>

          </div>

          <div style="margin-top: 24px; text-align: center;">
            <p style="font-size: 11px; color: #94a3b8; margin: 0 0 4px 0;">This digital pass is securely stored on <a href="https://gymdate.in" style="color: #e50914; text-decoration: none; font-weight: bold;">gymdate.in</a>.</p>
            <p style="font-size: 11px; color: #cbd5e1; margin: 0;">GymDate Technologies • All rights reserved</p>
          </div>

        </div>
      `,
      attachments: [
        {
          filename: `ticket-${shortId}.png`,
          content: qrBuffer,
          contentType: 'image/png',
          cid: 'gymdatepassqr',
          contentDisposition: 'inline',
          headers: {
            'Content-ID': '<gymdatepassqr>',
            'X-Attachment-Id': 'gymdatepassqr'
          }
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully: %s", info.messageId);
  } catch (err) {
    console.error("Test Error:", err);
  } finally {
    pool.end();
  }
}

run();
