import React from "react";

export const metadata = {
  title: "Frequently Asked Questions | GymDate",
  description: "Find answers to common questions about GymDate memberships, bookings, and more.",
};

export default function FAQ() {
  const faqs = [
    {
      q: "How do I book a gym session?",
      a: "Simply find a gym on our 'Explore' page, select a membership pack (Daily, 10-Day, or Monthly), and complete the payment. You'll receive a digital pass with a QR code immediately."
    },
    {
      q: "What do I need to show at the gym reception?",
      a: "Just open your GymDate account on your phone and show the QR code of your active booking to the receptionist. They will scan it and let you in."
    },
    {
      q: "Can I use multiple gyms with one pack?",
      a: "Our '10-Day' and 'Monthly' packs allow you to visit any partner gym in our network. Daily packs are usually restricted to the specific gym you chose at the time of booking."
    },
    {
      q: "Are there any hidden charges?",
      a: "No. The price you see on the platform is what you pay. It includes all taxes and gym entry fees."
    },
    {
      q: "What if I can't attend my session?",
      a: "Daily passes are valid for the specific date chosen. If you have a 10-day or monthly pack, you can use your sessions anytime within the validity period (usually 30 days)."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-5xl font-black text-secondary mb-4">
            Common <span className="text-primary">Questions</span>
          </h1>
          <p className="text-gray-500">Everything you need to know about GymDate.</p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 transition-all hover:shadow-md">
              <h3 className="text-lg font-bold text-secondary mb-3 flex items-start">
                <span className="text-primary mr-3 text-xl">Q.</span>
                {faq.q}
              </h3>
              <p className="text-gray-600 pl-8 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-primary rounded-3xl p-10 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
          <p className="mb-8 text-white/80">Our support team is here to help you 24/7.</p>
          <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            <a href="mailto:founder@gymdate.in" className="bg-white text-primary px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-all">Email Us</a>
            <a href="tel:+918143186677" className="bg-secondary text-white px-8 py-3 rounded-full font-bold hover:bg-black transition-all">Call +91 81431 86677</a>
          </div>
        </div>
      </div>
    </div>
  );
}
