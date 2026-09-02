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
import { useSession, signOut } from "next-auth/react";
import PartnerAuthProvider from "@/components/PartnerAuthProvider";

const partnerLinks = [
  { name: "My Gym Overview", href: "/partner/dashboard", icon: Store },
  { name: "Bookings & Revenue", href: "/partner/bookings", icon: CreditCard },
  { name: "Virtual Wallet", href: "/partner/wallet", icon: Wallet },
];

function DashboardContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      const publicPartnerRoutes = ["/partner", "/partner/login", "/partner/forgot-password", "/partner/reset-password"];
      if (!publicPartnerRoutes.includes(pathname)) {
        router.push("/partner/login");
      }
      return;
    }

    // Role check - ensure they are a partner if they are in protected routes
    if ((session?.user as any)?.role !== "partner" && !pathname.startsWith("/partner/login")) {
      const protectedPartnerRoutes = ["/partner/dashboard", "/partner/bookings", "/partner/wallet", "/partner/gym/edit", "/partner/scan", "/partner/settings"];
      
      if (protectedPartnerRoutes.some(route => pathname.startsWith(route))) {
        console.log("PartnerLayout: Unauthorized role, redirecting to login.");
        router.push("/partner/login");
      }
    }
  }, [session, status, pathname, router]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/partner/login" });
  };

  const isPublicRoute = pathname === "/partner" || pathname === "/partner/login" || pathname === "/partner/forgot-password" || pathname === "/partner/reset-password";

  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Handle loading state to prevent flickering
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session || (session.user as any).role !== "partner") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
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
            <Link href="/partner/dashboard" className="flex flex-col leading-none">
              <span className="text-xl font-black tracking-tight">
                <span style={{ color: "#ef4444" }}>Gym</span><span className="text-white">Date</span>
              </span>
              <span className="text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase mt-0.5">Partner Panel</span>
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
                {session?.user?.email ? session.user.email.charAt(0).toUpperCase() : "P"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {session?.user?.email || "Gym Partner"}
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
        {/* Super Admin Impersonation Notice Banner */}
        {(session?.user as any)?.isImpersonated && (
          <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2.5 flex items-center justify-between shadow-md z-30 shrink-0">
            <div className="flex items-center space-x-2 text-xs md:text-sm font-bold">
              <span className="bg-black/30 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-black">
                Super Admin Mode
              </span>
              <span className="truncate max-w-[200px] md:max-w-none">
                Viewing Partner Panel{(session?.user as any)?.gymName ? `: ${(session?.user as any)?.gymName}` : ""}
              </span>
            </div>
            <Link
              href="/superadmin/gyms"
              className="bg-white text-gray-900 px-3 py-1 rounded-lg text-xs font-black hover:bg-gray-100 transition-all shadow-sm flex items-center space-x-1 shrink-0 ml-2"
            >
              <span>← Return to Super Admin</span>
            </Link>
          </div>
        )}

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

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PartnerAuthProvider>
      <DashboardContent>{children}</DashboardContent>
    </PartnerAuthProvider>
  );
}
