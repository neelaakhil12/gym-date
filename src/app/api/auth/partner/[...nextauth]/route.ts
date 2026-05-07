import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

/**
 * PARTNER-ONLY NextAuth handler.
 * Uses a separate cookie (gymdate.partner-token) so partner sessions are
 * completely isolated from customer and admin sessions.
 */
export const partnerAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "PartnerCredentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const userResult = await query("SELECT * FROM users WHERE email = $1 AND role_id = 'partner'", [
          credentials.email,
        ]);
        if (userResult.rows.length === 0) throw new Error("No partner account found with this email.");

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
          role: "partner",
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
    maxAge: 12 * 60 * 60, // 12 hours for partner
  },
  pages: {
    signIn: "/partner/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  // ✅ Unique cookie — completely isolated from customer & admin sessions
  cookies: {
    sessionToken: {
      name: "gymdate.partner-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: "gymdate.partner-callback-url",
      options: {
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: "gymdate.partner-csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};

const handler = NextAuth(partnerAuthOptions);
export { handler as GET, handler as POST };
