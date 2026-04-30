"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Store, 
  Settings, 
  LogOut,
  Menu,
  X,
  CreditCard,
  Wallet
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const partnerLinks = [
  { name: "My Gym Overview", href: "/partner/dashboard", icon: Store },
  { name: "Bookings & Revenue", href: "/partner/bookings", icon: CreditCard },
  { name: "Virtual Wallet", href: "/partner/wallet", icon: Wallet },
];

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    // We only want to show the layout if we are inside the dashboard or deeper
    // Not on the login page itself
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const publicPartnerRoutes = ["/partner", "/partner/login", "/partner/forgot-password", "/partner/reset-password"];
        if (!publicPartnerRoutes.includes(pathname)) {
          router.push("/partner/login");
        }
      } else {
        setEmail(session.user.email || "Partner");
      }
    };
    checkAuth();
  }, [pathname, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/partner/login");
  };

  // If we are on login or auth recovery pages, don't show the dashboard sidebar
  const isPublicRoute = pathname === "/partner" || pathname === "/partner/login" || pathname === "/partner/forgot-password" || pathname === "/partner/reset-password";
  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 lg:translate-x-0 lg:static lg:block ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
            <Link href="/partner/dashboard" className="flex items-center">
              <img 
                src="/brand-logo.png" 
                alt="GymDate Logo" 
                className="h-10 w-auto brightness-0 invert object-contain"
              />
              <span className="ml-2 text-sm font-black tracking-tighter text-white uppercase opacity-50">Partner</span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Sidebar Links */}
          <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {partnerLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? "bg-primary text-white shadow-md shadow-primary/20" 
                      : "text-gray-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-white/10 bg-black/20">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm">
                {email ? email.charAt(0).toUpperCase() : "P"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {email || "Gym Partner"}
                </p>
                <p className="text-[10px] text-gray-400 truncate uppercase tracking-wider">Partner Account</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header (Mobile) */}
        <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center px-4 justify-between">
          <span className="text-lg font-bold text-slate-900">Partner Admin</span>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-600 hover:text-primary transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
