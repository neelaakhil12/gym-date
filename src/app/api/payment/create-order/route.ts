import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency = "INR", planName, gymId, gymName } = body;

    if (!amount || !planName || !gymId) {
      return NextResponse.json(
        { error: "Missing required fields: amount, planName, gymId" },
        { status: 400 }
      );
    }

    // Razorpay expects amount in paise (multiply INR by 100)
    const amountInPaise = Math.round(Number(amount) * 100);

    if (amountInPaise < 100) {
      return NextResponse.json(
        { error: "Amount must be at least ₹1" },
        { status: 400 }
      );
    }

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: `rcpt_${Date.now()}`,
      notes: {
        planName,
        gymId,
        gymName: gymName || "",
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("[Razorpay] create-order error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment order" },
      { status: 500 }
    );
  }
}
