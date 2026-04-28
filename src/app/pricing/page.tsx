"use client";

import React from "react";
import PricingCard from "@/components/PricingCard";
import { pricingPlans } from "@/data/mockData";
import { Shield, Zap, Clock, CreditCard } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen pt-32 pb-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-black text-secondary mb-6">
            Simple <span className="text-primary">Pricing</span>
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Choose the perfect plan for your fitness journey. No long-term contracts, just results.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-24">
          {pricingPlans.map((plan, idx) => (
            <PricingCard key={idx} plan={plan} />
          ))}
        </div>

        {/* Features Comparison / Info Section */}
        <div className="bg-white rounded-[40px] p-8 md:p-16 border border-gray-100 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { icon: Shield, title: "Secure Payments", desc: "All transactions are protected with industry-standard encryption." },
              { icon: Zap, title: "Instant Activation", desc: "Start your workout immediately after booking your pack." },
              { icon: Clock, title: "Flexible Validity", desc: "Our packs come with generous validity periods to suit your pace." },
              { icon: CreditCard, title: "No Hidden Costs", desc: "What you see is what you pay. No joining or maintenance fees." }
            ].map((feature, idx) => (
              <div key={idx} className="flex flex-col items-center md:items-start text-center md:text-left">
                <div className="h-14 w-14 bg-primary/5 rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h4 className="font-bold text-lg mb-3">{feature.title}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
