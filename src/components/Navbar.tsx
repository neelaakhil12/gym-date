"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Dumbbell, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Explore Gyms", href: "/explore" },
  { name: "About", href: "/about" },
  { name: "Partner With Us", href: "/partner" },
  { name: "Contact", href: "/contact" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { data: nextAuthSession } = useSession();

  const [supabaseSession, setSupabaseSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const hasSession = !!supabaseSession || !!nextAuthSession;

  // Generate Initials
  const getInitials = (name: string) => {
    if (!name) return "GY";
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const displayName = nextAuthSession?.user?.name || supabaseSession?.user?.user_metadata?.full_name || "Gym User";
  const initials = getInitials(displayName);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white border-b border-gray-100 shadow-sm",
        scrolled ? "py-1.5" : "py-2"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center group mt-1.5">
            <Image
              src="/logo.png"
              alt="GymDate Logo"
              width={145}
              height={46}
              className="w-32 h-auto object-contain transform transition-all group-hover:scale-105"
              priority
            />
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === link.href ? "text-primary" : "text-secondary"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {hasSession ? (
              <Link
                href="/account"
                className="flex items-center space-x-2 px-5 py-2.5 bg-gray-50 border border-gray-100 rounded-full hover:bg-white hover:shadow-sm transition-all group"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white overflow-hidden shadow-sm">
                   <span className="text-[10px] font-black">{initials}</span>
                </div>
                <span className="text-sm font-black text-secondary group-hover:text-primary transition-colors">Account</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="bg-primary text-white px-8 py-2.5 rounded-full text-sm font-black hover:bg-primary-dark transition-all transform hover:scale-105 active:scale-95 shadow-md shadow-primary/20 flex items-center space-x-2"
              >
                <span>Login / Join</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-secondary hover:text-primary transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "block px-3 py-3 text-base font-medium rounded-lg transition-colors",
                    pathname === link.href
                      ? "bg-primary/5 text-primary"
                      : "text-secondary hover:bg-gray-50 hover:text-primary"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 flex flex-col space-y-3">
                {hasSession ? (
                  <Link
                    href="/account"
                    onClick={() => setIsOpen(false)}
                    className="w-full text-center py-4 text-base font-black text-secondary bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center space-x-3"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white overflow-hidden">
                       <span className="text-[10px] font-black">{initials}</span>
                    </div>
                    <span>My Account</span>
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="w-full text-center py-4 text-base font-black text-white bg-primary rounded-xl shadow-lg shadow-primary/20"
                  >
                    Login / Join
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
