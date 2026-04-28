"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

interface AnimatedCounterProps {
  value: string; // e.g. "500+", "50k+", "1M+", "25+"
  className?: string;
}

// Parse a stat string into its numeric part and suffix
function parseStatValue(value: string): { number: number; suffix: string } {
  // Match: optional digits + optional decimal, then the rest (suffix like +, k+, M+, etc.)
  const match = value.match(/^(\d+\.?\d*)(.*)/);
  if (!match) return { number: 0, suffix: value };

  let num = parseFloat(match[1]);
  let suffix = match[2] || "";

  // If the suffix starts with 'k' or 'K', multiply by 1000 for accurate animation endpoint
  // But keep suffix as-is for display
  return { number: num, suffix };
}

export default function AnimatedCounter({ value, className = "" }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [displayValue, setDisplayValue] = useState("0");
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const { number, suffix } = parseStatValue(value);
    const duration = 2000; // ms
    const startTime = performance.now();

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOut(progress);
      const current = Math.floor(easedProgress * number);

      setDisplayValue(`${current}${suffix}`);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setDisplayValue(value); // Ensure final value is exactly correct
      }
    };

    requestAnimationFrame(tick);
  }, [isInView, value]);

  return (
    <span ref={ref} className={className}>
      {displayValue}
    </span>
  );
}
