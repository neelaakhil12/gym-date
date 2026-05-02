import React from "react";

export const metadata = {
  title: "Terms of Service | GymDate",
  description: "Read the terms and conditions for using the GymDate platform.",
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100">
          <h1 className="text-3xl md:text-5xl font-black text-secondary mb-8">
            Terms of <span className="text-primary">Service</span>
          </h1>
          
          <div className="prose prose-slate max-w-none space-y-8 text-gray-600 leading-relaxed">
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-secondary">1. Acceptance of Terms</h2>
              <p>
                By accessing and using GymDate, you agree to comply with and be bound by these Terms of Service. 
                If you do not agree with any part of these terms, you must not use our platform.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-secondary">2. User Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must be at least 18 years old or have parental consent to use this service.</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                <li>You agree to provide accurate and complete information during registration.</li>
                <li>You must follow the individual rules and regulations of the gyms you visit through our platform.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-secondary">3. Booking and Payments</h2>
              <p>
                All bookings are subject to availability. Payments are processed securely via our payment gateway partners. 
                GymDate acts as an aggregator between you and our Gym Partners.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Validity:</strong> Each membership pack has a specific validity period mentioned at the time of purchase.</li>
                <li><strong>Cancellations:</strong> Refund policies vary by pack type and gym partner. Please check the specific gym details before booking.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-secondary">4. Code of Conduct</h2>
              <p>
                Users must behave respectfully at all partner gyms. Any reports of harassment, equipment damage, or 
                misconduct may lead to permanent suspension of your GymDate account without refund.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-secondary">5. Limitation of Liability</h2>
              <p>
                GymDate provides a platform for booking but is not responsible for any injuries, accidents, or 
                theft that may occur at a partner gym facility. Users exercise and use gym equipment at their own risk.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-secondary">6. Modifications</h2>
              <p>
                We reserve the right to modify these terms at any time. Continued use of the platform after such changes 
                constitutes your acceptance of the new terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-secondary">7. Governing Law</h2>
              <p>
                These terms are governed by the laws of India, and any disputes shall be subject to the exclusive 
                jurisdiction of the courts in Visakhapatnam, Andhra Pradesh.
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
