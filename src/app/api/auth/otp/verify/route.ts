import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { otpCache } from "@/lib/otpCache";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, otp, name, phone } = await req.json();

    // 1. Fetch OTP from memory cache
    const cachedData = otpCache.get(email);

    if (!cachedData) {
      return NextResponse.json({ success: false, error: "No OTP found. Please send a new one." }, { status: 400 });
    }

    if (cachedData.otp !== otp) {
      return NextResponse.json({ success: false, error: "Invalid OTP code" }, { status: 400 });
    }

    if (Date.now() > cachedData.expires) {
      otpCache.delete(email);
      return NextResponse.json({ success: false, error: "OTP has expired" }, { status: 400 });
    }

    // 2. Clear OTP after successful use
    otpCache.delete(email);

    // 3. Update or Create User Profile with Name and Phone
    // We do this before generating the login link
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({ 
        email: email,
        full_name: name,
        phone: `+91${phone}`,
        role_id: 'user'
      }, { onConflict: 'email' });

    if (profileError) {
      console.error("Profile Update Error:", profileError);
      // Continue anyway, but log it
    }

    // 4. Generate a login link for this user to get a real session
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    const origin = req.headers.get('origin') || siteUrl;
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${origin}/account`
      }
    });

    if (linkError) throw linkError;

    return NextResponse.json({ 
      success: true, 
      loginLink: linkData.properties.action_link 
    });
  } catch (error: any) {
    console.error("OTP Verify Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
