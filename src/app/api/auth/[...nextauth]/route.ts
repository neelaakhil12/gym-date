import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { otpCache } from "@/lib/otpCache";
import { query } from "@/lib/db";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "OTP",
      credentials: {
        email: { label: "Email", type: "text" },
        otp: { label: "OTP", type: "text" },
        name: { label: "Name", type: "text" },
        phone: { label: "Phone", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.otp) return null;

        const { email, otp, name, phone } = credentials;

        // 1. Verify OTP
        const cachedData = otpCache.get(email);
        if (!cachedData) throw new Error("No OTP found. Please send a new one.");
        if (cachedData.otp !== otp) throw new Error("Invalid OTP code");
        if (Date.now() > cachedData.expires) {
          otpCache.delete(email);
          throw new Error("OTP has expired");
        }

        // 2. Clear OTP
        otpCache.delete(email);

        // 3. Upsert user in Postgres
        const phoneFormatted = phone ? (phone.startsWith("+91") ? phone : `+91${phone}`) : null;
        
        let userResult = await query("SELECT * FROM users WHERE email = $1", [email]);
        
        if (userResult.rows.length === 0) {
          userResult = await query(
            "INSERT INTO users (email, full_name, phone, role_id) VALUES ($1, $2, $3, 'user') RETURNING *",
            [email, name || "User", phoneFormatted]
          );
        } else {
           // update name and phone if provided
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
