import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // ONLY check the admin_users table
        const userResult = await query(
          "SELECT id, email, full_name, password_hash, 'super_admin' as role_id FROM admin_users WHERE email = $1",
          [credentials.email]
        );

        if (userResult.rows.length === 0) throw new Error("Super Admin account not found");

        const user = userResult.rows[0];
        const isValid = await bcrypt.compare(credentials.password, user.password_hash);
        if (!isValid) throw new Error("Invalid password");

        return {
          id: user.id,
          name: user.full_name,
          email: user.email,
          role: user.role_id,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/superadmin",
  },
  // Dedicated cookie for Super Admin
  cookies: {
    sessionToken: {
      name: `gymdate.admin-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
