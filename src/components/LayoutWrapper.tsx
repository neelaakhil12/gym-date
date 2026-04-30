"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LocationGate from "@/components/LocationGate";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Hide Navbar and Footer on admin and partner sub-pages (login, dashboard, etc.)
  // But show it on the main landing page /partner
  const isAuthPage = pathname?.startsWith("/admin") || (pathname?.startsWith("/partner") && pathname !== "/partner");

  if (isAuthPage) {
    return <main className="flex-grow">{children}</main>;
  }

  return (
    <LocationGate>
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
      <WhatsAppButton />
    </LocationGate>
  );
}
