import { NextResponse } from "next/server";
import { registerPartnerRequest } from "@/actions/gymActions";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gymName, ownerName, email, phone, city, address, referredBy } = body;

    if (!gymName || !ownerName || !email || !phone || !city || !address) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing required partnership fields." 
      }, {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    const result = await registerPartnerRequest({
      gymName,
      ownerName,
      email,
      phone,
      city,
      address,
      referredBy: referredBy || undefined,
    });

    if (result.error) {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Partnership request registered successfully!" 
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (error: any) {
    console.error("API Partner Register Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "An unexpected server error occurred." 
    }, {
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}
