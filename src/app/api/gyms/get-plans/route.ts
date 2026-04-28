import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gymId = searchParams.get('gymId');

    if (!gymId) {
      return NextResponse.json({ success: false, error: "Gym ID is required" }, { status: 400 });
    }

    const { data: plans, error } = await supabaseAdmin
      .from('pricing_plans')
      .select('*')
      .eq('gym_id', gymId)
      .order('price', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      plans: plans || [] 
    });
  } catch (error: any) {
    console.error("Get Plans Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
