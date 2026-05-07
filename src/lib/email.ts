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
    const qrDataUrl = await QRCode.toDataURL(booking.ticket_code || booking.id);
    
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
