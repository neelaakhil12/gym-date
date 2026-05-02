"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Dumbbell, 
  Users, 
  Wallet, 
  LogOut,
  Menu,
  X,
  Banknote,
  ClipboardList
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";

const adminLinks = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Gyms", href: "/admin/gyms", icon: Dumbbell },
  { name: "Partner Leads", href: "/admin/partner-requests", icon: ClipboardList },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Revenue", href: "/admin/revenue", icon: Wallet },
  { name: "Payouts", href: "/admin/payouts", icon: Banknote },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const publicAdminPaths = ["/admin", "/admin/forgot-password", "/admin/reset-password"];
    
    if (status === "loading") return;

    if (!session) {
      if (!publicAdminPaths.includes(pathname)) {
        router.push("/admin");
      }
      return;
    }

    // Role check (Super Admin only)
    if (session.user?.role !== "super_admin" && !publicAdminPaths.includes(pathname)) {
      signOut({ callbackUrl: "/admin" });
    }
  }, [session, status, pathname, router]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/admin" });
  };

  // If we are on a public admin page, don't show the dashboard sidebar
  const publicAdminPaths = ["/admin", "/admin/forgot-password", "/admin/reset-password"];
  if (publicAdminPaths.includes(pathname)) {
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
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-secondary text-white transform transition-transform duration-300 lg:translate-x-0 lg:static lg:block ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
            <Link href="/admin/dashboard" className="flex items-center">
              <span className="text-xl font-black text-white tracking-tighter">
                GYMDATE <span className="text-primary">SUPER ADMIN</span>
              </span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-300 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Sidebar Links */}
          <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {adminLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname?.startsWith(link.href);
              
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? "bg-primary text-white shadow-md shadow-primary/20" 
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
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
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                A
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {session?.user?.email || "Super Admin"}
                </p>
                <p className="text-xs text-gray-400 truncate">Platform Manager</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white/10 hover:bg-red-500/20 text-gray-300 hover:text-red-400 rounded-lg transition-colors text-sm font-medium"
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
          <span className="text-lg font-bold text-secondary">GymDate Admin</span>
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
