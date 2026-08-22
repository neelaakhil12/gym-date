"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LocationGate from "@/components/LocationGate";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Hide Navbar and Footer on admin, partner, and map-view pages
  const isAuthPage = 
    pathname?.startsWith("/superadmin") ||
    pathname?.startsWith("/admin") || 
    pathname?.startsWith("/operation-admin") ||
    pathname?.startsWith("/map-view") ||
    (pathname?.startsWith("/partner") && pathname !== "/partner");

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
