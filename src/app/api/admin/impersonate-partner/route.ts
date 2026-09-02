import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decode, encode } from "next-auth/jwt";
import { query } from "@/lib/db";
import crypto from "crypto";

async function verifySuperAdmin(cookieStore: any) {
  const adminTokenCookie = 
    cookieStore.get("gymdate.admin-token")?.value || 
    cookieStore.get("__Secure-gymdate.admin-token")?.value;

  if (!adminTokenCookie) return null;

  try {
    const decoded = await decode({
      token: adminTokenCookie,
      secret: process.env.NEXTAUTH_SECRET || "",
    });

    if (decoded && (decoded.role === "super_admin" || decoded.role === "admin")) {
      return decoded;
    }
  } catch (err) {
    console.error("Super Admin token decode error:", err);
  }

  return null;
}

async function handleImpersonation(gymId: string, cookieStore: any) {
  if (!gymId) {
    throw new Error("gymId is required");
  }

  // 1. Fetch gym
  const gymRes = await query("SELECT * FROM gyms WHERE id = $1", [gymId]);
  if (gymRes.rows.length === 0) {
    throw new Error("Gym not found");
  }
  const gym = gymRes.rows[0];

  // 2. Find associated partner account
  let partnerUser: any = null;

  // Check partner_users by gym_id
  const puByGym = await query("SELECT * FROM partner_users WHERE gym_id = $1 LIMIT 1", [gymId]);
  if (puByGym.rows.length > 0) {
    partnerUser = puByGym.rows[0];
  }

  // If not found, check partner_users by gym.partner_id
  if (!partnerUser && gym.partner_id) {
    const puById = await query("SELECT * FROM partner_users WHERE id = $1 LIMIT 1", [gym.partner_id]);
    if (puById.rows.length > 0) {
      partnerUser = puById.rows[0];
    }
  }

  // If not found, check users table by gym.partner_id
  if (!partnerUser && gym.partner_id) {
    const uById = await query("SELECT * FROM users WHERE id = $1 LIMIT 1", [gym.partner_id]);
    if (uById.rows.length > 0) {
      partnerUser = uById.rows[0];
    }
  }

  // If still no partner user exists (e.g. gym created by admin directly), provision one
  if (!partnerUser) {
    const newId = crypto.randomUUID();
    const cleanGymName = gym.name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "partner";
    const partnerEmail = `partner_${cleanGymName.slice(0, 10)}_${gym.id.slice(0, 6)}@gymdate.in`;
    const partnerName = `${gym.name} Partner`;

    const insertPu = await query(
      `INSERT INTO partner_users (id, gym_id, email, full_name, role) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (email) DO UPDATE SET gym_id = $2
       RETURNING *`,
      [newId, gym.id, partnerEmail, partnerName, "partner"]
    );
    partnerUser = insertPu.rows[0];

    // Ensure gym points to this partner
    await query("UPDATE gyms SET partner_id = $1 WHERE id = $2", [partnerUser.id, gym.id]);
  }

  // 3. Issue signed partner session JWT
  const tokenPayload = {
    id: partnerUser.id,
    name: partnerUser.full_name || gym.name,
    email: partnerUser.email,
    role: "partner",
    sub: partnerUser.id,
    isImpersonated: true,
    gymId: gym.id,
    gymName: gym.name,
  };

  const partnerToken = await encode({
    token: tokenPayload,
    secret: process.env.NEXTAUTH_SECRET || "",
    maxAge: 12 * 60 * 60,
  });

  // 4. Set gymdate.partner-token cookie
  const isProd = process.env.NODE_ENV === "production";
  cookieStore.set("gymdate.partner-token", partnerToken, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: 12 * 60 * 60,
  });

  return {
    gym,
    partnerUser,
    redirectUrl: "/partner/dashboard",
  };
}

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const admin = await verifySuperAdmin(cookieStore);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized: Super Admin access required." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const gymId = searchParams.get("gymId");
    if (!gymId) {
      return NextResponse.json({ success: false, error: "gymId parameter is required." }, { status: 400 });
    }

    const result = await handleImpersonation(gymId, cookieStore);
    return NextResponse.redirect(new URL(result.redirectUrl, req.url));
  } catch (err: any) {
    console.error("Impersonation error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to switch to partner view." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const admin = await verifySuperAdmin(cookieStore);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized: Super Admin access required." }, { status: 401 });
    }

    const body = await req.json();
    const gymId = body.gymId;
    if (!gymId) {
      return NextResponse.json({ success: false, error: "gymId parameter is required." }, { status: 400 });
    }

    const result = await handleImpersonation(gymId, cookieStore);
    return NextResponse.json({
      success: true,
      gymName: result.gym.name,
      partnerEmail: result.partnerUser.email,
      redirectUrl: result.redirectUrl,
    });
  } catch (err: any) {
    console.error("Impersonation error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to switch to partner view." }, { status: 500 });
  }
}
