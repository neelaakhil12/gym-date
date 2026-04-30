import React from "react";
import Image from "next/image";
import { Target, Heart, Award, ShieldCheck, Zap, Users, Sparkles, MapPin, CheckCircle2 } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-44 pb-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mission Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
          <div>
            <span className="text-primary font-black uppercase tracking-widest text-xs mb-4 block">Our Mission</span>
            <h1 className="text-4xl md:text-6xl font-black text-secondary mb-8 leading-tight">
              Making Fitness <span className="text-primary">Accessible</span> For Everyone.
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed mb-6">
              At GymDate, we believe that fitness should be flexible, affordable, and accessible. Our platform connects fitness enthusiasts with premium gyms across India, offering the freedom to workout whenever and wherever they want.
            </p>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">
              We are not just a booking platform; we are a movement dedicated to breaking the barriers of traditional gym memberships. Whether you're a traveler, a busy professional, or someone who loves variety in their workouts, GymDate provides you with the key to unlock every top-tier gym in the country.
            </p>

          </div>
          <div className="relative h-[500px] rounded-[40px] overflow-hidden shadow-2xl">
            <Image
              src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=2000"
              alt="About Us"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Value Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-32">
          {[
            { icon: Target, title: "Flexibility", desc: "Choose from daily, weekly, or monthly packs. No long-term commitments or hidden fees." },
            { icon: Heart, title: "Fitness for All", desc: "Whether you are a beginner or a pro, we have the right space and equipment for your journey." },
            { icon: Award, title: "Pan-India Access", desc: "One membership, hundreds of gyms across all major cities in India. Workout while you travel." },
            { icon: ShieldCheck, title: "Trusted Partners", desc: "We only partner with top-rated gyms that meet our high standards for safety and hygiene." }
          ].map((value, idx) => (
            <div key={idx} className="p-8 rounded-3xl bg-gray-50 hover:bg-white hover:shadow-2xl hover:shadow-black/5 transition-all group duration-500 border border-transparent hover:border-gray-100">
              <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                <value.icon className="h-7 w-7 text-primary group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-secondary">{value.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{value.desc}</p>
            </div>
          ))}
        </div>

        {/* Why Choose Us Section */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <span className="text-primary font-black uppercase tracking-widest text-xs mb-4 block">The GymDate Advantage</span>
            <h2 className="text-3xl md:text-5xl font-black text-secondary">Why <span className="text-primary">Choose</span> Us?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { 
                icon: Zap, 
                title: "Instant Access", 
                desc: "No more waiting for manager approvals. Book your pack, get your QR code instantly, and start training in minutes." 
              },
              { 
                icon: Sparkles, 
                title: "Premium Experience", 
                desc: "We curate only the best gyms with state-of-the-art equipment, certified trainers, and exceptional amenities." 
              },
              { 
                icon: Users, 
                title: "Vibrant Community", 
                desc: "Join a growing community of fitness enthusiasts who value freedom and results over rigid contracts." 
              },
              { 
                icon: MapPin, 
                title: "Location Freedom", 
                desc: "Switch between gyms near your office and home. Your fitness routine never has to stop because of your commute." 
              },
              { 
                icon: CheckCircle2, 
                title: "Transparent Pricing", 
                desc: "What you see is what you pay. No registration fees, no processing fees, just pure fitness value." 
              },
              { 
                icon: Award, 
                title: "Verified Reviews", 
                desc: "Read honest feedback from real gym members to find the perfect environment for your specific goals." 
              }
            ].map((item, idx) => (
              <div key={idx} className="flex space-x-6">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-gray-50 rounded-xl flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-secondary mb-2">{item.title}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Story Section */}
        <div className="bg-secondary rounded-[60px] p-12 md:p-24 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/10 -skew-x-12 translate-x-1/2" />
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-black mb-8">The GymDate <span className="text-primary">Story</span></h2>
            <div className="space-y-6 text-gray-300 leading-relaxed text-lg">
              <p>Founded in 2025, GymDate started with a simple but powerful observation: people want to stay fit, but traditional gym memberships are too rigid, expensive, and restrictive for modern lifestyles.</p>
              <p>We set out to build a platform that gives power back to the user. By partnering with the best gyms in every city, we've created a seamless digital network that moves with you, whether you're at home, work, or traveling across India.</p>
              <p>Our vision is to build a world where fitness is as easy as booking a cab. Today, we are proud to be India's fastest-growing flexible gym booking platform, helping thousands of people achieve their fitness goals on their own terms, without being tied down by yearly contracts.</p>
              <p>From local weightlifting rooms to premium luxury fitness centers, GymDate brings the entire Indian fitness ecosystem to your fingertips.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
