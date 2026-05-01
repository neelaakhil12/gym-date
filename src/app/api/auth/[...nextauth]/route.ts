import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { otpCache } from "@/lib/otpCache";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "select_account",
        }
      }
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        otp: { label: "OTP", type: "text" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
        phone: { label: "Phone", type: "text" },
        role: { label: "Role", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const { email, otp, password, name, phone, role } = credentials;

        // 1. Password Login (Admin / Partner)
        if (password) {
          try {
            // First time setup - create password_hash column if it doesn't exist
            await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash varchar;');
          } catch (e) {
            console.log('Column password_hash already exists or error:', e);
          }

          const userResult = await query("SELECT * FROM users WHERE email = $1", [email]);
          if (userResult.rows.length === 0) {
            throw new Error("No user found with this email");
          }

          const user = userResult.rows[0];

          // If they don't have a password set, they must use the forgot password flow
          if (!user.password_hash) {
            throw new Error("No password set for this account. Please use forgot password.");
          }

          const isMatch = await bcrypt.compare(password, user.password_hash);
          if (!isMatch) {
            throw new Error("Invalid password");
          }

          // Verify requested role
          if (role && role === 'admin' && user.role_id !== 'super_admin') {
             throw new Error("Access Denied: You do not have super admin privileges.");
          }

          return {
            id: user.id,
            name: user.full_name,
            email: user.email,
            role: user.role_id,
          };
        }

        // 2. OTP Login (Customer)
        if (otp) {
          const cachedData = otpCache.get(email);
          if (!cachedData) throw new Error("No OTP found. Please send a new one.");
          if (cachedData.otp !== otp) throw new Error("Invalid OTP code");
          if (Date.now() > cachedData.expires) {
            otpCache.delete(email);
            throw new Error("OTP has expired");
          }

          otpCache.delete(email);

          const phoneFormatted = phone ? (phone.startsWith("+91") ? phone : `+91${phone}`) : null;
          let userResult = await query("SELECT * FROM users WHERE email = $1", [email]);
          
          if (userResult.rows.length === 0) {
            userResult = await query(
              "INSERT INTO users (email, full_name, phone, role_id) VALUES ($1, $2, $3, 'user') RETURNING *",
              [email, name || "User", phoneFormatted]
            );
          } else {
             if (name || phoneFormatted) {
                 await query(
                     "UPDATE users SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone) WHERE email = $3",
                     [name || null, phoneFormatted, email]
                 );
             }
          }

          const user = userResult.rows[0];
          return {
            id: user.id,
            name: user.full_name,
            email: user.email,
            role: user.role_id,
          };
        }

        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, user }: any) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (user) {
        token.role = user.role || 'user';
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: any) {
      session.accessToken = token.accessToken;
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || "gymdate-secret-key-2026",
});

export { handler as GET, handler as POST };
