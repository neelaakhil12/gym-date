import { NextResponse } from "next/server";
import { getGyms } from "@/actions/publicActions";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const gyms = await getGyms();
    return NextResponse.json({ 
      success: true, 
      gyms: gyms || [] 
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (error: any) {
    console.error("API Get Gyms Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

