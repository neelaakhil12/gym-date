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
        role: { label: "Role", type: "text" },
        type: { label: "Type", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const { email, otp, password, name, phone, role } = credentials;
        const type = (credentials as any)?.type;
        const cleanEmail = email.trim().toLowerCase();
        const actionType = type === "signup" ? "signup" : "login";

        // 1. Password Login (Admin/Staff/Partner)
        if (password) {
          // If a specific role is requested from the login page, we only check that table
          const targetRole = (credentials as any)?.role; // 'admin' for super admin, 'staff' for operation admin
          
          let userResult: any = { rows: [] };

          if (targetRole === 'admin') {
            // Super Admin login only checks admin_users
            userResult = await query("SELECT id, email, full_name, password_hash, 'super_admin' as role_id FROM admin_users WHERE email = $1", [email]);
          } else if (targetRole === 'staff') {
            // Operations Admin login only checks staff_users
            userResult = await query("SELECT id, email, full_name, password_hash, 'operation_admin' as role_id FROM staff_users WHERE email = $1", [email]);
          } else if (targetRole === 'partner') {
            // Partner login checks partner_users first
            userResult = await query("SELECT id, email, full_name, password_hash, 'partner' as role_id FROM partner_users WHERE email = $1", [email]);
            if (userResult.rows.length === 0) {
              userResult = await query("SELECT id, email, full_name, password_hash, role_id FROM users WHERE email = $1", [email]);
            }
          } else {
            // Default check for partners or generic login
            userResult = await query("SELECT id, email, full_name, password_hash, role_id FROM users WHERE email = $1", [email]);
            if (userResult.rows.length === 0) {
              userResult = await query("SELECT id, email, full_name, password_hash, 'partner' as role_id FROM partner_users WHERE email = $1", [email]);
            }
            
            // Legacy/fallback check
            if (userResult.rows.length === 0) {
              userResult = await query("SELECT id, email, full_name, password_hash, 'super_admin' as role_id FROM admin_users WHERE email = $1", [email]);
            }
            if (userResult.rows.length === 0) {
              userResult = await query("SELECT id, email, full_name, password_hash, 'operation_admin' as role_id FROM staff_users WHERE email = $1", [email]);
            }
          }

          if (userResult.rows.length === 0) throw new Error("User not found or incorrect role");
          
          const user = userResult.rows[0];
          const isValid = await bcrypt.compare(password, user.password_hash);
          if (!isValid) throw new Error("Invalid password");

          // Only allow admins, staff, or partners to use password login here
          const allowedRoles = ['super_admin', 'operation_admin', 'partner'];
          if (!allowedRoles.includes(user.role_id)) throw new Error("Unauthorized access");

          return {
            id: user.id,
            name: user.full_name,
            email: user.email,
            role: user.role_id,
          };
        }

        // 2. OTP Login (Customer)
        if (otp) {
          // Strictly verify OTP from otpCache for all users
          const cachedData = otpCache.get(cleanEmail);
          if (!cachedData) throw new Error("No OTP found. Please send a new one.");
          if (cachedData.otp !== otp.trim()) throw new Error("Invalid OTP code. Please enter the valid code sent to your email.");
          if (Date.now() > cachedData.expires) {
            otpCache.delete(cleanEmail);
            throw new Error("OTP has expired. Please request a new code.");
          }

          otpCache.delete(cleanEmail);

          const phoneFormatted = phone ? (phone.startsWith("+91") ? phone : `+91${phone}`) : null;
          let userResult = await query("SELECT * FROM users WHERE email = $1", [cleanEmail]);
          
          if (userResult.rows.length === 0) {
            if (actionType === "login") {
              if (cleanEmail === "neelaakhilharish@gmail.com") {
                userResult = await query(
                  "INSERT INTO users (email, full_name, role_id) VALUES ($1, $2, $3) RETURNING *",
                  [cleanEmail, name || "Admin", "admin"]
                );
              } else {
                throw new Error("No account found with this email address. Please sign up to create an account.");
              }
            } else {
              // Sign up flow: create new user
              const userColsRes = await query(`
                SELECT column_name FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = 'users'
              `);
              const userCols = new Set((userColsRes.rows || []).map((r: any) => r.column_name.toLowerCase()));

              const insertCols = ["email", "full_name", "role_id"];
              const insertVals: any[] = [cleanEmail, name || "User", "user"];

              if (phoneFormatted && userCols.has("phone")) {
                insertVals.push(phoneFormatted);
                insertCols.push("phone");
              }

              if (userCols.has("wallet_balance")) {
                const configRes = await query("SELECT value FROM platform_config WHERE key = 'signup_bonus'");
                const signupBonus = parseFloat(configRes.rows[0]?.value || '0');
                insertVals.push(signupBonus);
                insertCols.push("wallet_balance");
              }

              const placeholders = insertVals.map((_, i) => `$${i + 1}`).join(", ");
              userResult = await query(
                `INSERT INTO users (${insertCols.join(", ")}) VALUES (${placeholders}) RETURNING *`,
                insertVals
              );
            }
          } else {
             if (name || phoneFormatted) {
                 await query(
                     "UPDATE users SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone) WHERE email = $3",
                     [name || null, phoneFormatted, cleanEmail]
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
            const userColsRes = await query(`
              SELECT column_name FROM information_schema.columns 
              WHERE table_schema = 'public' AND table_name = 'users'
            `);
            const userCols = new Set((userColsRes.rows || []).map((r: any) => r.column_name.toLowerCase()));

            const insertCols = ["email", "full_name", "role_id"];
            const insertVals: any[] = [email, name || "User", "user"];

            if (userCols.has("wallet_balance")) {
              const configRes = await query("SELECT value FROM platform_config WHERE key = 'signup_bonus'");
              const signupBonus = parseFloat(configRes.rows[0]?.value || '0');
              insertVals.push(signupBonus);
              insertCols.push("wallet_balance");
            }

            const placeholders = insertVals.map((_, i) => `$${i + 1}`).join(", ");
            await query(
              `INSERT INTO users (${insertCols.join(", ")}) VALUES (${placeholders})`,
              insertVals
            );
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
