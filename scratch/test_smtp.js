
const nodemailer = require("nodemailer");
require('dotenv').config({ path: '.env.local' });

async function testEmail() {
  console.log("Testing SMTP with:");
  console.log("Host:", process.env.SMTP_HOST);
  console.log("Port:", process.env.SMTP_PORT);
  console.log("User:", process.env.SMTP_USER);
  console.log("Pass:", process.env.SMTP_PASSWORD ? "****" : "MISSING");

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log("Verifying connection...");
    await transporter.verify();
    console.log("Connection verified successfully!");

    console.log("Sending test email...");
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.SMTP_USER,
      subject: "GymDate SMTP Test",
      text: "If you see this, your SMTP settings are correct!"
    });
    console.log("Test email sent successfully to", process.env.SMTP_USER);
  } catch (err) {
    console.error("SMTP Test Failed:");
    console.error(err);
  }
}

testEmail();
