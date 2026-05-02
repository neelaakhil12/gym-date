import React from "react";

export const metadata = {
  title: "Privacy Policy | GymDate",
  description: "Learn how GymDate collects, uses, and protects your personal information.",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100">
          <h1 className="text-3xl md:text-5xl font-black text-secondary mb-8">
            Privacy <span className="text-primary">Policy</span>
          </h1>
          
          <div className="prose prose-slate max-w-none space-y-8 text-gray-600 leading-relaxed">
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-secondary">1. Introduction</h2>
              <p>
                Welcome to GymDate. We value your privacy and are committed to protecting your personal data. 
                This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website 
                and use our fitness booking services.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-secondary">2. Information We Collect</h2>
              <p>We collect information that you provide directly to us, including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Personal Details:</strong> Name, email address, phone number, and profile picture.</li>
                <li><strong>Booking Information:</strong> Gyms you visit, dates of training, and membership packs purchased.</li>
                <li><strong>Payment Data:</strong> Transaction identifiers (we do not store full credit card numbers; these are handled by our secure payment partners like Razorpay).</li>
                <li><strong>Location Data:</strong> With your permission, we use your location to show gyms near you.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-secondary">3. How We Use Your Information</h2>
              <p>Your data helps us provide a better experience, specifically for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Processing your gym bookings and generating digital passes.</li>
                <li>Verifying your identity at gym receptions via QR codes.</li>
                <li>Sending booking confirmations and important platform updates.</li>
                <li>Improving our website performance and user interface.</li>
                <li>Preventing fraudulent transactions and ensuring platform security.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-secondary">4. Data Sharing</h2>
              <p>
                We share your name and booking details with the specific **Gym Partner** you have booked with to facilitate 
                your entry. We do **not** sell your personal data to third-party advertisers.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-secondary">5. Your Rights</h2>
              <p>
                You have the right to access, correct, or delete your personal information. You can manage your profile 
                settings directly in your account dashboard or contact our support team for assistance.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-secondary">6. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please reach out to us at:
                <br />
                <strong>Email:</strong> founder@gymdate.in
                <br />
                <strong>Phone:</strong> +91 81431 86677
              </p>
            </section>

            <p className="text-xs text-gray-400 pt-8 border-t border-gray-100">
              Last Updated: May 2, 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
