import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";
import NextAuthProvider from "@/components/NextAuthProvider";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GymDate | Book Premium Gyms Pan India",
  description: "Find and book top-rated gyms across India. Flexibility, fitness for all, and trusted partners.",
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <NextAuthProvider>
          <LayoutWrapper>
            {children}
            <Toaster position="top-center" />
          </LayoutWrapper>
        </NextAuthProvider>
      </body>
    </html>
  );
}
