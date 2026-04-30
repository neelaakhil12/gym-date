import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gymId = searchParams.get('gymId');

    if (!gymId) {
      return NextResponse.json({ success: false, error: "Gym ID is required" }, { status: 400 });
    }

    const result = await query(
      'SELECT * FROM pricing_plans WHERE gym_id = $1 ORDER BY price ASC',
      [gymId]
    );

    return NextResponse.json({ 
      success: true, 
      plans: result.rows || [] 
    });
  } catch (error: any) {
    console.error("Get Plans Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
