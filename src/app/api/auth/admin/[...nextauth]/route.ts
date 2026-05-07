import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

/**
 * ADMIN-ONLY NextAuth handler.
 * Uses a separate cookie (gymdate.admin-token) so admin sessions are
 * completely isolated from customer and partner sessions.
 */
export const adminAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "AdminCredentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const userResult = await query("SELECT * FROM admin_users WHERE email = $1", [
          credentials.email,
        ]);
        if (userResult.rows.length === 0) throw new Error("No user found.");

        const user = userResult.rows[0];

        if (!user.password_hash)
          throw new Error("No password set. Use forgot password.");

        const isMatch = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );
        if (!isMatch) throw new Error("Invalid password.");

        return {
          id: user.id,
          name: user.full_name,
          email: user.email,
          role: "super_admin",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 8 * 60 * 60, // 8 hours for admin
  },
  pages: {
    signIn: "/admin",
  },
  secret: process.env.NEXTAUTH_SECRET,
  // ✅ Unique cookie — completely isolated from customer & partner sessions
  cookies: {
    sessionToken: {
      name: "gymdate.admin-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: "gymdate.admin-callback-url",
      options: {
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: "gymdate.admin-csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};

const handler = NextAuth(adminAuthOptions);
export { handler as GET, handler as POST };
