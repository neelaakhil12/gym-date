import { NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/actions/emailActions";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email address is required." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const result = await sendPasswordResetEmail(trimmedEmail, "/partner/reset-password");

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message || "Password reset link has been sent to your email!"
    });
  } catch (error: any) {
    console.error("[Partner Forgot Password API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send reset link." },
      { status: 500 }
    );
  }
}
