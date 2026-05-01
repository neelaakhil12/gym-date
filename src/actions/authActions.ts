"use server";

import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function resetPasswordWithToken(email: string, token: string, newPassword: string) {
  try {
    // 1. Verify token
    const result = await query(
      "SELECT * FROM password_resets WHERE email = $1 AND token = $2 AND expires_at > NOW()",
      [email, token]
    );

    if (result.rows.length === 0) {
      return { error: "Invalid or expired reset link. Please request a new one." };
    }

    // 2. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Update user password
    await query(
      "UPDATE users SET password_hash = $1 WHERE email = $2",
      [hashedPassword, email]
    );

    // 4. Delete the used token
    await query(
      "DELETE FROM password_resets WHERE email = $1 AND token = $2",
      [email, token]
    );

    return { success: true };
  } catch (err: any) {
    console.error("Reset password error:", err);
    return { error: "Failed to reset password. Please try again." };
  }
}
