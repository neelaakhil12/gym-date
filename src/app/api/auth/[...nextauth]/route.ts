import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { otpCache } from "@/lib/otpCache";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions = {
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
            // Get signup bonus from config
            const configRes = await query("SELECT value FROM platform_config WHERE key = 'signup_bonus'");
            const signupBonus = parseFloat(configRes.rows[0]?.value || '0');

            userResult = await query(
              "INSERT INTO users (email, full_name, phone, role_id, wallet_balance) VALUES ($1, $2, $3, 'user', $4) RETURNING *",
              [email, name || "User", phoneFormatted, signupBonus]
            );

            if (signupBonus > 0) {
              await query(
                "INSERT INTO referral_transactions (referrer_id, referred_user_email, type, amount, status) VALUES ($1, $2, 'signup_bonus', $3, 'credited')",
                [userResult.rows[0].id, email, signupBonus]
              );
              console.log(`[Auth] Credited ₹${signupBonus} signup bonus to new user ${email}`);
            }
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
    async signIn({ user, account, profile }: any) {
      if (account?.provider === "google") {
        try {
          const { email, name } = user;
          // Check if user exists
          const userResult = await query("SELECT * FROM users WHERE email = $1", [email]);
          
          if (userResult.rows.length === 0) {
            // Get signup bonus from config
            const configRes = await query("SELECT value FROM platform_config WHERE key = 'signup_bonus'");
            const signupBonus = parseFloat(configRes.rows[0]?.value || '0');

            // Create new user
            const newUserRes = await query(
              "INSERT INTO users (email, full_name, role_id, wallet_balance) VALUES ($1, $2, 'user', $3) RETURNING id",
              [email, name || "User", signupBonus]
            );

            if (signupBonus > 0) {
              await query(
                "INSERT INTO referral_transactions (referrer_id, referred_user_email, type, amount, status) VALUES ($1, $2, 'signup_bonus', $3, 'credited')",
                [newUserRes.rows[0].id, email, signupBonus]
              );
            }
          } else {
            // Update existing user to ensure sync
            await query(
              "UPDATE users SET full_name = COALESCE($1, full_name) WHERE email = $2",
              [name || null, email]
            );
          }
          return true;
        } catch (error) {
          console.error("Error syncing Google user to DB:", error);
          return true;
        }
      }
      return true;
    },
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
    strategy: "jwt" as const,
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: `gymdate.user-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: `gymdate.user-callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `gymdate.user-csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
