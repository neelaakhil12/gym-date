"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Dumbbell, PlusCircle, LogOut, Menu, X } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import StaffAuthProvider from "@/components/StaffAuthProvider";

const staffLinks = [
  { name: "All Gyms", href: "/operation-admin/gyms", icon: Dumbbell },
  { name: "Create Gym", href: "/operation-admin/gyms/create", icon: PlusCircle },
];

function StaffDashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const publicPaths = ["/operation-admin"];

  useEffect(() => {
    if (status === "loading") return;
    if (!session && !publicPaths.includes(pathname)) {
      router.push("/operation-admin");
      return;
    }
    if (session && (session.user as any)?.role !== "operation_admin" && !publicPaths.includes(pathname)) {
      signOut({ callbackUrl: "/operation-admin" });
    }
  }, [session, status, pathname, router]);

  // On public login page — render without sidebar
  if (publicPaths.includes(pathname)) {
    return <>{children}</>;
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!session || (session.user as any)?.role !== "operation_admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-secondary text-white transform transition-transform duration-300 lg:translate-x-0 lg:static lg:block ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
            <span className="text-lg font-black text-white tracking-tighter">
              GYMDATE <span className="text-primary">OPERATIONS</span>
            </span>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-300 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Links */}
          <div className="flex-1 px-4 py-6 space-y-2">
            {staffLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${isActive ? "bg-primary text-white shadow-md" : "text-gray-300 hover:bg-white/10 hover:text-white"}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Profile & Logout */}
          <div className="p-4 border-t border-white/10 bg-black/20">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                {session?.user?.email?.[0].toUpperCase() || "S"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{session?.user?.name || session?.user?.email}</p>
                <p className="text-xs text-gray-400 truncate">Operations Staff</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/operation-admin" })}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white/10 hover:bg-red-500/20 text-gray-300 hover:text-red-400 rounded-lg transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center px-4 justify-between">
          <span className="text-lg font-bold text-secondary">Operations Panel</span>
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 hover:text-primary">
            <Menu className="w-6 h-6" />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function OperationAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <StaffAuthProvider>
      <StaffDashboardContent>{children}</StaffDashboardContent>
    </StaffAuthProvider>
  );
}
