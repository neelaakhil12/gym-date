"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function WebSplashScreen() {
  const [phase, setPhase] = useState<"countdown" | "reveal">("countdown");
  const [count, setCount] = useState(3);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // 3 → 2 → 1 countdown (700ms each)
    const t1 = setTimeout(() => setCount(2), 700);
    const t2 = setTimeout(() => setCount(1), 1400);
    // After "1", reveal the logo
    const t3 = setTimeout(() => setPhase("reveal"), 2100);
    // Logo stays visible for 3 full seconds after reveal, then fade out
    const t4 = setTimeout(() => setVisible(false), 2100 + 3000 + 600); // 5700ms total

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  if (!visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "#fff" }}
        >
          {/* Subtle red radial glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 70% 55% at 50% 50%, rgba(239,68,68,0.10) 0%, rgba(255,255,255,0) 80%)",
            }}
          />

          {/* COUNTDOWN PHASE */}
          <AnimatePresence mode="wait">
            {phase === "countdown" && (
              <motion.div
                key="countdown"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.4 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center gap-6 select-none px-6 w-full max-w-xs mx-auto"
              >
                {/* Animated number */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={count}
                    initial={{ scale: 0.4, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 1.6, opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="relative"
                  >
                    {/* Ring pulse */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0.6 }}
                      animate={{ scale: 1.6, opacity: 0 }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className="absolute inset-0 rounded-full border-4 border-red-500"
                    />
                    <div
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center text-white font-black shadow-2xl"
                      style={{
                        fontSize: 56,
                        background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
                        boxShadow: "0 0 60px rgba(239,68,68,0.45), 0 4px 32px rgba(0,0,0,0.10)",
                      }}
                    >
                      {count}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Dot progress */}
                <div className="flex gap-3 mt-2">
                  {[3, 2, 1].map((n) => (
                    <motion.div
                      key={n}
                      animate={{
                        backgroundColor: count <= n ? "#ef4444" : "#e5e7eb",
                        scale: count === n ? 1.3 : 1,
                      }}
                      transition={{ duration: 0.3 }}
                      className="w-2.5 h-2.5 rounded-full"
                    />
                  ))}
                </div>

                <p className="text-xs font-bold tracking-[0.25em] text-gray-400 uppercase mt-1">
                  Get Ready...
                </p>
              </motion.div>
            )}

            {/* LOGO REVEAL PHASE */}
            {phase === "reveal" && (
              <motion.div
                key="reveal"
                initial={{ opacity: 0, scale: 0.75, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center select-none w-full px-8 sm:px-10"
                style={{ gap: "20px" }}
              >
                {/* Logo — responsive: full width on mobile, capped on desktop */}
                <motion.div
                  initial={{ filter: "blur(14px)", opacity: 0 }}
                  animate={{ filter: "blur(0px)", opacity: 1 }}
                  transition={{ duration: 0.55, delay: 0.05, ease: "easeOut" }}
                  className="w-full flex items-center justify-center"
                >
                  <Image
                    src="/gym-logo-transparent.png"
                    alt="GymDate Logo"
                    width={500}
                    height={260}
                    className="object-contain drop-shadow-xl"
                    style={{
                      width: "100%",
                      maxWidth: "min(460px, 88vw)",
                      height: "auto",
                    }}
                    priority
                  />
                </motion.div>

                {/* Tagline — centered, full width, wraps on mobile */}
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.25 }}
                  className="text-center font-bold uppercase"
                  style={{
                    color: "#ef4444",
                    fontSize: "clamp(11px, 3vw, 14px)",
                    letterSpacing: "0.18em",
                    lineHeight: 1.6,
                    padding: "0 4px",
                  }}
                >
                  Train Anywhere. Stay Fit Everywhere.
                </motion.p>

                {/* Animated underline — centered */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
                  style={{
                    height: 3,
                    width: 100,
                    borderRadius: 99,
                    background: "linear-gradient(90deg, #ef4444, #fca5a5)",
                    transformOrigin: "center",
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Skip button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            onClick={() => setVisible(false)}
            className="absolute bottom-8 sm:bottom-10 text-xs font-bold tracking-widest uppercase text-gray-400 hover:text-red-500 transition-colors px-5 py-2 rounded-full hover:bg-red-50"
          >
            Skip →
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
