"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function WebSplashScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [count, setCount] = useState(1);

  useEffect(() => {
    // 1 -> 2 -> 3 countdown timer (each step ~800ms)
    const timer1 = setTimeout(() => setCount(2), 850);
    const timer2 = setTimeout(() => setCount(3), 1700);
    const timer3 = setTimeout(() => {
      setShowSplash(false);
    }, 2600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  if (!showSplash) return null;

  return (
    <AnimatePresence>
      {showSplash && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: "blur(4px)" }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[99999] bg-white flex flex-col items-center justify-center select-none overflow-hidden"
        >
          {/* Subtle background glow */}
          <div className="absolute w-[500px] h-[500px] bg-red-500/5 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />

          {/* Logo Container */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex flex-col items-center max-w-sm sm:max-w-md px-6 text-center"
          >
            <div className="relative w-72 sm:w-80 h-28 sm:h-32 mb-6 flex items-center justify-center">
              <Image
                src="/brand-logo.png"
                alt="GymDate Logo"
                width={360}
                height={140}
                className="w-full h-full object-contain"
                priority
              />
            </div>

            {/* Countdown Badge */}
            <div className="flex flex-col items-center gap-3 mt-2">
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((step) => (
                  <motion.div
                    key={step}
                    animate={{
                      scale: count === step ? 1.25 : 1,
                      backgroundColor: count >= step ? "#ef4444" : "#e5e7eb",
                      color: count >= step ? "#ffffff" : "#9ca3af",
                    }}
                    transition={{ duration: 0.3 }}
                    className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-sm transition-colors"
                  >
                    {step}
                  </motion.div>
                ))}
              </div>

              {/* Dynamic taglines */}
              <motion.p
                key={count}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="text-xs font-bold text-gray-500 uppercase tracking-wider h-4"
              >
                {count === 1 && "Train Anywhere"}
                {count === 2 && "Stay Fit Everywhere"}
                {count === 3 && "Welcome to GymDate!"}
              </motion.p>
            </div>

            {/* Skip Button */}
            <button
              onClick={() => setShowSplash(false)}
              className="mt-8 text-[11px] font-bold text-gray-400 hover:text-red-500 tracking-wider uppercase transition-colors px-4 py-1.5 rounded-full hover:bg-red-50"
            >
              Skip →
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
