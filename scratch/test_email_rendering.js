const { sendBookingConfirmationEmail } = require('../src/lib/email');

async function testEmail() {
  const sampleBooking = {
    id: "9cee076d-1ac9-4aa9-ad20-9e2b0d5991a3",
    customer_email: "neelaakhilharish@gmail.com",
    customer_name: "Akhil Harish Neela",
    plan_name: "YEARLY",
    amount: "15000",
    start_date: new Date(),
    end_date: new Date(Date.now() + 365*24*60*60*1000),
    gyms: {
      name: "cultfit gym",
      location: "https://maps.app.goo.gl/5JLwTRRZwJxQPPUX6?g_st=ac"
    }
  };

  const res = await sendBookingConfirmationEmail(sampleBooking);
  console.log("Email sent result:", res);
}

testEmail();
