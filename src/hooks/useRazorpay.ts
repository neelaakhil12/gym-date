"use client";

import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";

interface PaymentOptions {
  gymId: string;
  gymName: string;
  planName: string;
  amount: number;
  startDate?: string; // ISO date string e.g. "2026-05-01"
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  onSuccess?: (bookingId: string, paymentId: string) => void;
  onFailure?: (error: string) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export function useRazorpay() {
  const { data: nextAuthSession } = useSession();

  const initiatePayment = useCallback(async (options: PaymentOptions) => {
    const { gymId, gymName, planName, amount, startDate, onSuccess, onFailure } = options;

    // ── 1. Ensure user is logged in ──────────────────────────────────────
    const email = nextAuthSession?.user?.email;
    const userId = (nextAuthSession?.user as any)?.id || "";

    if (!email) {
      onFailure?.("Please log in to complete your booking.");
      return;
    }

    // ── 2. Load Razorpay checkout script ─────────────────────────────────
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      onFailure?.("Failed to load payment gateway. Check your internet connection.");
      return;
    }

    // ── 3. Create order on server ─────────────────────────────────────────
    let order: { orderId: string; amount: number; currency: string; keyId: string };
    try {
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, planName, gymId, gymName }),
      });

      if (!res.ok) {
        const err = await res.json();
        onFailure?.(err.error || "Could not create payment order.");
        return;
      }

      order = await res.json();
    } catch (e: any) {
      onFailure?.(e.message || "Network error while creating order.");
      return;
    }

    // ── 4. Open Razorpay checkout ─────────────────────────────────────────
    const rzpOptions = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "GymDate",
      description: `${planName} — ${gymName}`,
      order_id: order.orderId,
      prefill: {
        email: email,
        name: nextAuthSession?.user?.name || "",
      },
      theme: {
        color: "#e50914",
        backdrop_color: "#0a0a0a",
      },
      modal: {
        ondismiss: () => onFailure?.("Payment cancelled."),
      },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        // ── 5. Verify on server and create booking ────────────────────────
        try {
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
               razorpay_signature: response.razorpay_signature,
              userId: userId,
              gymId,
              planName,
              amount,
              startDate,
              customerName: options.customerName || nextAuthSession?.user?.name || "",
              customerPhone: options.customerPhone,
              customerEmail: options.customerEmail || email,
            }),
          });

          const result = await verifyRes.json();

          if (!verifyRes.ok || !result.success) {
            onFailure?.(result.error || "Payment verification failed.");
          } else {
            onSuccess?.(result.bookingId, response.razorpay_payment_id);
          }
        } catch (e: any) {
          onFailure?.(e.message || "Verification network error.");
        }
      },
    };

    const rzp = new window.Razorpay(rzpOptions);
    rzp.open();
  }, []);

  return { initiatePayment };
}
