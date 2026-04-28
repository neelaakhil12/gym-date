import nodemailer from "nodemailer";
import QRCode from "qrcode";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendBookingConfirmationEmail(booking: any) {
  try {
    // 1. Generate QR Code as Data URL
    const qrDataUrl = await QRCode.toDataURL(booking.id);
    
    // 2. Prepare Email Content
    const mailOptions = {
      from: `"GymDate" <${process.env.SMTP_USER}>`,
      to: booking.customer_email,
      subject: `Booking Confirmed: ${booking.gyms?.name} — GymDate`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 40px; border-radius: 20px;">
          <h1 style="color: #e50914; text-align: center;">GymDate</h1>
          <h2 style="text-align: center; color: #333;">Your Subscription is Confirmed!</h2>
          <p>Hi ${booking.customer_name},</p>
          <p>Thank you for booking your membership at <strong>${booking.gyms?.name}</strong>. Your payment of <strong>₹${booking.amount}</strong> was successful.</p>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 15px; margin: 30px 0;">
            <h3 style="margin-top: 0;">Subscription Details:</h3>
            <p style="margin: 5px 0;"><strong>Plan:</strong> ${booking.plan_name}</p>
            <p style="margin: 5px 0;"><strong>Valid From:</strong> ${new Date(booking.start_date).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Valid Until:</strong> ${new Date(booking.end_date).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> Active</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="margin-bottom: 15px; color: #666;">Need directions to the gym?</p>
            <a href="${booking.gyms?.location}" style="background: #e50914; color: white; padding: 12px 25px; border-radius: 10px; text-decoration: none; font-weight: bold; display: inline-block;">
              📍 Open in Google Maps
            </a>
          </div>

          <div style="text-align: center; margin: 40px 0;">
            <p style="font-weight: bold; margin-bottom: 20px;">Your Access QR Code:</p>
            <img src="cid:qrcode" alt="Access QR Code" style="width: 200px; height: 200px; border: 10px solid #eee; padding: 10px; border-radius: 15px;" />
            <p style="font-size: 12px; color: #999; margin-top: 10px;">Show this code at the gym entrance to get in.</p>
          </div>

          <p style="font-size: 12px; color: #666; text-align: center; margin-top: 50px;">
            This is an automated confirmation from GymDate.<br/>
            Visit <a href="https://www.gymdate.com" style="color: #e50914; text-decoration: none;">www.gymdate.com</a> for more info.
          </p>
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
