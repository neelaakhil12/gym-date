"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, Phone, MapPin, Send, Camera, X, Globe } from "lucide-react";

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema)
  });

  const onSubmit = async (data: ContactFormValues) => {
    console.log("Contact form submitted:", data);
    await new Promise(resolve => setTimeout(resolve, 1500));
    alert("Message sent successfully! We'll get back to you soon.");
  };

  return (
    <div className="min-h-screen pt-44 pb-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-black text-secondary mb-6">
            Get In <span className="text-primary">Touch</span>
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Have questions about our packs or partnering with us? We're here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-12">
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-secondary">Contact Information</h2>
              <p className="text-gray-500 leading-relaxed">
                Reach out to us through any of these channels. Our team is available Mon-Sat, 9am to 6pm.
              </p>
            </div>

            <div className="space-y-6">
              {[
                { icon: Phone, label: "Phone", value: "+91 81431 86677", color: "bg-blue-50 text-blue-600", href: "tel:+918143186677" },
                { icon: Mail, label: "Email", value: "founder@gymdate.in", color: "bg-primary/5 text-primary", href: "mailto:founder@gymdate.in" },
                { icon: MapPin, label: "Office", value: "5-2-6, Lakshmi Devi Peta, Opp Durga Devi Temple, Anakapali, Visakhapatnam 531001, Andhra Pradesh", color: "bg-purple-50 text-purple-600", href: null }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl flex-shrink-0 ${item.color}`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="font-bold text-secondary hover:text-primary transition-colors">{item.value}</a>
                    ) : (
                      <p className="font-bold text-secondary">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-gray-100">
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Follow Us</p>
              <div className="flex space-x-4">
                {[Camera, X, Globe].map((Icon, idx) => (
                  <a key={idx} href="#" className="p-3 bg-gray-50 rounded-xl hover:bg-primary hover:text-white transition-all">
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 p-8 md:p-12 rounded-[40px] border border-gray-100 shadow-inner">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">Your Name</label>
                    <input
                      {...register("name")}
                      className={`w-full px-5 py-4 rounded-2xl bg-white border outline-none transition-all ${errors.name ? "border-red-500" : "border-gray-100 focus:border-primary"}`}
                      placeholder="John Doe"
                    />
                    {errors.name && <p className="text-red-500 text-[10px] font-bold">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">Email Address</label>
                    <input
                      {...register("email")}
                      className={`w-full px-5 py-4 rounded-2xl bg-white border outline-none transition-all ${errors.email ? "border-red-500" : "border-gray-100 focus:border-primary"}`}
                      placeholder="john@example.com"
                    />
                    {errors.email && <p className="text-red-500 text-[10px] font-bold">{errors.email.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">Subject</label>
                  <input
                    {...register("subject")}
                    className={`w-full px-5 py-4 rounded-2xl bg-white border outline-none transition-all ${errors.subject ? "border-red-500" : "border-gray-100 focus:border-primary"}`}
                    placeholder="How can we help you?"
                  />
                  {errors.subject && <p className="text-red-500 text-[10px] font-bold">{errors.subject.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">Message</label>
                  <textarea
                    {...register("message")}
                    rows={5}
                    className={`w-full px-5 py-4 rounded-2xl bg-white border outline-none transition-all ${errors.message ? "border-red-500" : "border-gray-100 focus:border-primary"}`}
                    placeholder="Type your message here..."
                  />
                  {errors.message && <p className="text-red-500 text-[10px] font-bold">{errors.message.message}</p>}
                </div>

                <button
                  disabled={isSubmitting}
                  className="w-full py-5 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-all transform active:scale-95 flex items-center justify-center space-x-3 shadow-lg shadow-primary/20"
                >
                  <Send className="h-5 w-5" />
                  <span>{isSubmitting ? "Sending..." : "Send Message"}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
