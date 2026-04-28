import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, name, phone, lat, lng, address } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const updates: any = {};
    if (name) updates.full_name = name;
    if (phone) updates.phone = phone.startsWith('+91') ? phone : `+91${phone}`;
    if (lat !== undefined) updates.latitude = lat;
    if (lng !== undefined) updates.longitude = lng;
    if (address) updates.address_name = address;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert({
        email,
        ...updates,
        role_id: 'user'
      }, { onConflict: 'email' })
      .select()
      .single();

    if (error) {
      console.error("Critical Profile Sync Error:", error);
      return NextResponse.json({ 
        success: false, 
        error: `Database Error: ${error.message}. Please ensure you ran the SQL command to add latitude/longitude columns.` 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: data });
  } catch (error: any) {
    console.error("Profile Sync Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
