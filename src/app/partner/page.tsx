"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { TrendingUp, Users, Shield, LayoutGrid, CheckCircle } from "lucide-react";
import { registerPartnerRequest } from "@/actions/gymActions";
import WhatsAppButton from "@/components/WhatsAppButton";
import { toast } from "react-hot-toast";

const partnerSchema = z.object({
  gymName: z.string().min(2, "Gym name is required"),
  ownerName: z.string().min(2, "Owner name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Valid phone number is required"),
  city: z.string().min(2, "City is required"),
  address: z.string().min(5, "Full address is required"),
});

type PartnerFormValues = z.infer<typeof partnerSchema>;

export default function PartnerPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerSchema)
  });

  const onSubmit = async (data: PartnerFormValues) => {
    try {
      const result = await registerPartnerRequest(data);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Registration submitted successfully!");
      reset();

      // Redirect to WhatsApp
      const message = `Hello GymDate! I am ${data.ownerName}, owner of ${data.gymName} in ${data.city}. I just submitted my registration on your website and would like to discuss the onboarding process.`;
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/9100061091?text=${encodedMessage}`;
      
      // Small delay to let the toast show
      setTimeout(() => {
        window.open(whatsappUrl, "_blank");
      }, 1500);

    } catch (error) {
      toast.error("An unexpected error occurred.");
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ... (rest of the page) */}
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-black text-secondary mb-6">
            Partner With <span className="text-primary">GymDate</span>
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Grow your gym business with India's largest fitness network. Get more footfall, zero risk, and a powerful dashboard.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
          {[
            { icon: TrendingUp, title: "Increased Revenue", desc: "Monetize your empty slots and boost your monthly income significantly." },
            { icon: Users, title: "Higher Footfall", desc: "Get discovered by thousands of new fitness enthusiasts in your area." },
            { icon: Shield, title: "Zero Risk", desc: "No registration fee. We only earn when you earn. Pure partnership." },
            { icon: LayoutGrid, title: "Smart Dashboard", desc: "Manage bookings, view analytics, and track earnings in real-time." }
          ].map((benefit, idx) => (
            <div key={idx} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
              <div className="h-16 w-16 bg-primary/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors duration-300">
                <benefit.icon className="h-8 w-8 text-primary group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{benefit.desc}</p>
            </div>
          ))}
        </div>

        {/* Registration Form Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div className="space-y-8">
            <h2 className="text-3xl font-black text-secondary">Register Your <span className="text-primary">Gym</span></h2>
            <p className="text-gray-500 leading-relaxed">
              Fill out the form below and our partnership team will get in touch with you within 24-48 hours to discuss the onboarding process.
            </p>
            
            <div className="space-y-6">
              {[
                "Instant onboarding process",
                "Dedicated account manager",
                "Marketing support across our channels",
                "Real-time payment settlements"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-primary" />
                  <span className="font-bold text-secondary">{item}</span>
                </div>
              ))}
            </div>

            <div className="bg-secondary rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
              <h4 className="text-xl font-bold mb-2 italic">"Joining GymDate was the best decision for my studio. Our footfall increased by 40% in just 3 months."</h4>
              <p className="text-gray-400 text-sm">— Rahul Sharma, Owner of FitLife Studio</p>
            </div>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-2xl shadow-primary/5 border border-gray-100">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">Gym Name</label>
                  <input
                    {...register("gymName")}
                    className={`w-full px-4 py-3 rounded-xl bg-gray-50 border outline-none transition-all ${errors.gymName ? "border-red-500" : "border-gray-100 focus:border-primary focus:bg-white"}`}
                    placeholder="Enter gym name"
                  />
                  {errors.gymName && <p className="text-red-500 text-[10px] font-bold">{errors.gymName.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">Owner Name</label>
                  <input
                    {...register("ownerName")}
                    className={`w-full px-4 py-3 rounded-xl bg-gray-50 border outline-none transition-all ${errors.ownerName ? "border-red-500" : "border-gray-100 focus:border-primary focus:bg-white"}`}
                    placeholder="Full name"
                  />
                  {errors.ownerName && <p className="text-red-500 text-[10px] font-bold">{errors.ownerName.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">Email Address</label>
                  <input
                    {...register("email")}
                    className={`w-full px-4 py-3 rounded-xl bg-gray-50 border outline-none transition-all ${errors.email ? "border-red-500" : "border-gray-100 focus:border-primary focus:bg-white"}`}
                    placeholder="owner@gym.com"
                  />
                  {errors.email && <p className="text-red-500 text-[10px] font-bold">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">Phone Number</label>
                  <input
                    {...register("phone")}
                    className={`w-full px-4 py-3 rounded-xl bg-gray-50 border outline-none transition-all ${errors.phone ? "border-red-500" : "border-gray-100 focus:border-primary focus:bg-white"}`}
                    placeholder="+91 00000 00000"
                  />
                  {errors.phone && <p className="text-red-500 text-[10px] font-bold">{errors.phone.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">City</label>
                <input
                  {...register("city")}
                  className={`w-full px-4 py-3 rounded-xl bg-gray-50 border outline-none transition-all ${errors.city ? "border-red-500" : "border-gray-100 focus:border-primary focus:bg-white"}`}
                  placeholder="e.g. Bangalore"
                />
                {errors.city && <p className="text-red-500 text-[10px] font-bold">{errors.city.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Full Address</label>
                <textarea
                  {...register("address")}
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl bg-gray-50 border outline-none transition-all ${errors.address ? "border-red-500" : "border-gray-100 focus:border-primary focus:bg-white"}`}
                  placeholder="Enter complete gym address"
                />
                {errors.address && <p className="text-red-500 text-[10px] font-bold">{errors.address.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Registration"}
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Floating WhatsApp Button */}
      <WhatsAppButton />
    </div>
  );
}
