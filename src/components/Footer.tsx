"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Dumbbell, Camera, X, Globe, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return null;
  }
  return (
    <footer className="bg-secondary text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href="/" className="block mt-2">
              <Image
                src="/logo.png"
                alt="GymDate Logo"
                width={200}
                height={60}
                className="object-contain"
              />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              India's first and largest network of premium gyms. Experience fitness freedom with our flexible membership plans.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-primary transition-colors">
                <Camera className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-primary transition-colors">
                <X className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-primary transition-colors">
                <Globe className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-6">Quick Links</h4>
            <ul className="space-y-4 text-gray-400">
              <li><Link href="/explore" className="hover:text-primary transition-colors text-sm">Explore Gyms</Link></li>
              <li><Link href="/pricing" className="hover:text-primary transition-colors text-sm">Pricing Plans</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors text-sm">About Us</Link></li>
              <li><Link href="/partner" className="hover:text-primary transition-colors text-sm">Partner With Us</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-bold mb-6">Support</h4>
            <ul className="space-y-4 text-gray-400">
              <li><Link href="/contact" className="hover:text-primary transition-colors text-sm">Contact Us</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors text-sm">Terms of Service</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition-colors text-sm">FAQs</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-bold mb-6">Get In Touch</h4>
            <ul className="space-y-4 text-gray-400">
              <li className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="text-sm">Sector 5, HSR Layout, Bangalore</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-primary" />
                <span className="text-sm">+91 98765 43210</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-primary" />
                <span className="text-sm">support@gymdate.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-6">
            <p className="text-gray-500 text-xs">
              © {new Date().getFullYear()} GymDate. All rights reserved.
            </p>
            <Link href="/partner/login" className="text-gray-500 hover:text-primary transition-colors text-xs font-semibold">
              Gym Partner Login
            </Link>
          </div>
          <div className="flex space-x-6">
            <span className="text-gray-500 text-xs">Made with ❤️ in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
