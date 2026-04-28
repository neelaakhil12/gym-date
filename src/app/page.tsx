"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, MapPin, ArrowRight, ShieldCheck, Zap, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { getGyms, getCities, getPricingPlans } from "@/lib/supabase";
import { gyms as mockGyms, cities as mockCities, pricingPlans as mockPricingPlans } from "@/data/mockData";
import GymCard from "@/components/GymCard";
import CityCard from "@/components/CityCard";
import { TypeAnimation } from "react-type-animation";
import { getPlatformStats } from "@/actions/adminActions";
import AnimatedCounter from "@/components/AnimatedCounter";

export default function Home() {
  const [gyms, setGyms] = useState(mockGyms);
  const [cities, setCities] = useState(mockCities);
  const [platformStats, setPlatformStats] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const dbGyms = await getGyms();
      const dbCities = await getCities();
      const dbStats = await getPlatformStats();
      
      setGyms(dbGyms);
      setCities(dbCities);
      setPlatformStats(dbStats);
    }
    loadData();
  }, []);
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-auto min-h-[75vh] md:h-[90vh] flex items-center pt-28 pb-8 md:pt-20 md:pb-0">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&q=80&w=2000"
            alt="Gym Background"
            fill
            className="object-cover brightness-[0.4]"
            priority
          />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h1 className="text-xl sm:text-3xl md:text-5xl lg:text-7xl font-black text-white mb-16 md:mb-6 leading-tight min-h-[80px] sm:min-h-[100px] md:min-h-[180px] lg:min-h-[240px]">
              Book Gyms Near You.{" "}
              <TypeAnimation
                sequence={[
                  'Anytime. Anywhere.',
                  2000,
                  'On Your Terms.',
                  2000,
                  'Without Limits.',
                  2000
                ]}
                wrapper="span"
                speed={50}
                className="text-primary block sm:inline"
                repeat={Infinity}
                cursor={false}
              />
            </h1>
            <p className="hidden sm:block text-base md:text-xl text-gray-300 mb-4 md:mb-10 leading-relaxed">
              Find and book premium gyms near you with flexible daily, weekly, and monthly packs. No long-term commitments, just pure fitness.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-2 md:gap-4 justify-center items-center lg:justify-start mb-4 md:mb-12">
              <Link
                href="/explore"
                className="bg-primary text-white px-4 py-2 md:px-8 md:py-4 rounded-full text-xs md:text-lg font-bold hover:bg-primary-dark transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center space-x-1 md:space-x-2"
              >
                <span>Start Training Now</span>
                <ArrowRight className="h-3 w-3 md:h-5 md:w-5" />
              </Link>
              <Link
                href="/partner"
                className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-4 py-2 md:px-8 md:py-4 rounded-full text-xs md:text-lg font-bold hover:bg-white/20 transition-all flex items-center justify-center"
              >
                Partner With Us
              </Link>
            </div>
            
            {/* Quick Search */}
            <div className="hidden sm:flex bg-white p-2 rounded-2xl sm:rounded-full shadow-2xl flex-col sm:flex-row gap-2 max-w-xl mx-auto lg:mx-0">
              <div className="flex-grow flex items-center px-4 py-2 border-b sm:border-b-0 sm:border-r border-gray-100">
                <MapPin className="h-5 w-5 text-primary mr-3" />
                <input
                  type="text"
                  placeholder="Enter city or area..."
                  className="w-full bg-transparent border-none focus:ring-0 text-secondary font-medium placeholder:text-gray-400"
                />
              </div>
              <button className="bg-secondary text-white p-4 rounded-xl sm:rounded-full hover:bg-primary transition-all flex items-center justify-center space-x-2 group">
                <Search className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="sm:hidden font-bold">Search Gyms</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Strip - right after hero */}
      <section className="bg-primary py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {platformStats.length > 0 ? platformStats.map((stat, idx) => (
              <div key={idx} className="text-white text-center">
                <div className="text-3xl md:text-4xl font-black mb-1">
                  <AnimatedCounter value={stat.value} />
                </div>
                <div className="text-white/60 font-bold uppercase tracking-widest text-xs">{stat.label}</div>
              </div>
            )) : [
              { label: "Gyms", value: "500+" },
              { label: "Cities", value: "25+" },
              { label: "Members", value: "50k+" },
              { label: "Bookings", value: "1M+" }
            ].map((stat, idx) => (
              <div key={idx} className="text-white text-center">
                <div className="text-3xl md:text-4xl font-black mb-1">
                  <AnimatedCounter value={stat.value} />
                </div>
                <div className="text-white/60 font-bold uppercase tracking-widest text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-secondary mb-4">
              How It <span className="text-primary italic">Works</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Getting started with GymDate is as easy as 1-2-3. No long forms, no hidden charges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: MapPin, title: "Find a Gym", desc: "Browse from 500+ premium gyms across India based on your location and preferences." },
              { icon: Zap, title: "Choose a Pack", desc: "Select a flexible daily, 10-day, or monthly pack that fits your schedule perfectly." },
              { icon: ShieldCheck, title: "Start Training", desc: "Show your QR at the reception and start your workout. It's that simple!" }
            ].map((step, idx) => (
              <div key={idx} className="flex flex-col items-center text-center group">
                <div className="h-20 w-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:bg-primary group-hover:rotate-6 group-hover:shadow-xl group-hover:shadow-primary/20">
                  <step.icon className="h-10 w-10 text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Rated Gyms Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-3xl md:text-5xl font-black text-secondary mb-4">
                Top Rated <span className="text-primary italic">Gyms</span>
              </h2>
              <p className="text-gray-500">Premium fitness spaces curated just for you.</p>
            </div>
            <Link href="/explore" className="text-primary font-bold flex items-center hover:underline group">
              View all gyms <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {gyms.map((gym) => (
              <GymCard key={gym.id} gym={gym} />
            ))}
          </div>
        </div>
      </section>


      {/* Featured Cities Section */}
      <section className="py-24 bg-secondary overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
              Explore <span className="text-primary italic">Cities</span>
            </h2>
            <p className="text-gray-400">Available in all major metros across India.</p>
          </div>
        </div>

        {/* Horizontal Auto-Scroll Container */}
        <div className="relative flex overflow-hidden py-10">
          <motion.div 
            className="flex space-x-6 whitespace-nowrap"
            animate={{ 
              x: ["0%", "-50%"] 
            }}
            transition={{ 
              duration: 40, 
              ease: "linear", 
              repeat: Infinity 
            }}
            style={{ width: "fit-content" }}
          >
            {/* Double the list for seamless infinite scroll */}
            {[...cities, ...cities].map((city, idx) => (
              <div key={idx} className="w-[300px] flex-shrink-0">
                <CityCard city={city} />
              </div>
            ))}
          </motion.div>
          
          {/* Fading Edges */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-secondary to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-secondary to-transparent z-10" />
        </div>
      </section>

      {/* Trust/Banner Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-8">
            Are You a Gym Owner?
          </h2>
          <p className="text-white/80 text-xl mb-12 max-w-3xl mx-auto">
            Join the GymDate network and grow your business. Reach thousands of potential members and manage your gym with our smart dashboard.
          </p>
          <Link
            href="/partner"
            className="inline-block bg-secondary text-white px-10 py-5 rounded-full text-xl font-bold hover:bg-black transition-all shadow-2xl"
          >
            Become a Partner
          </Link>
        </div>
      </section>
    </div>
  );
}
