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
  metadataBase: new URL('https://gymdate.in'),
  title: {
    default: "GymDate | Book Premium Gyms Pan India",
    template: "%s | GymDate"
  },
  description: "Find and book top-rated gyms across India. Experience fitness freedom with our flexible daily, weekly, and monthly gym membership plans. No long-term commitments.",
  keywords: ["gym near me", "book gym online", "daily gym pass", "fitness center", "premium gyms India", "workout", "GymDate", "flexible gym membership"],
  authors: [{ name: "GymDate" }],
  creator: "GymDate",
  publisher: "GymDate",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "GymDate | Book Premium Gyms Pan India",
    description: "Find and book top-rated gyms across India. Experience fitness freedom with our flexible daily, weekly, and monthly gym membership plans.",
    url: "https://gymdate.in",
    siteName: "GymDate",
    images: [
      {
        url: "/brand-logo.png", // Ideally, you should have a specific og-image.jpg (1200x630) in your public folder
        width: 1200,
        height: 630,
        alt: "GymDate - Premium Fitness Network",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GymDate | Book Premium Gyms Pan India",
    description: "Experience fitness freedom with flexible gym access across India.",
    images: ["/brand-logo.png"],
  },
  verification: {
    google: "793f9734d99cba80",
  },
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
