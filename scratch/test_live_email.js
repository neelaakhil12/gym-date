const { sendBookingConfirmationEmail } = require('../src/lib/email');

async function test() {
  const dummyBooking = {
    id: "43af27ef-1234-5678-90ab-cdef12345678",
    customer_name: "NEELA AKHIL HARISH",
    customer_email: "neelaakhilharish@gmail.com",
    plan_name: "MONTHLY PASS",
    amount: "499",
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    gyms: {
      name: "National Gym & Fitness",
      location: "https://maps.app.goo.gl/CcM67HvSfe7L9rqf6",
      address: "Kukatpally, Hyderabad"
    }
  };

  console.log("Testing email send...");
  const res = await sendBookingConfirmationEmail(dummyBooking);
  console.log("Result:", res);
}

test();
