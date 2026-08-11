"use client";

import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

export default function AOSInit() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: "ease-in-out-cubic",
      once: false,   // Keeps animations triggering EVERY TIME user scrolls
      mirror: true,  // Re-animates elements when scrolling back up
      offset: 80,
    });
  }, []);

  return null;
}
