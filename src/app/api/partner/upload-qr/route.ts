import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = 'force-dynamic';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let buffer: Buffer;
    let ext = "png";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      if (!file) {
        return NextResponse.json({ success: false, error: "No file uploaded." }, { status: 400, headers: corsHeaders });
      }
      ext = file.name?.split(".").pop() || "png";
      buffer = Buffer.from(await file.arrayBuffer());
    } else {
      const body = await req.json();
      if (!body.base64) {
        return NextResponse.json({ success: false, error: "No base64 image provided." }, { status: 400, headers: corsHeaders });
      }
      const matches = body.base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mime = matches[1];
        ext = mime.split("/")[1] || "png";
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(body.base64, 'base64');
      }
    }

    const uploadDir = process.env.NODE_ENV === 'production' 
      ? '/var/www/gymdate_uploads/payouts' 
      : path.join(process.cwd(), 'public', 'uploads', 'payouts');

    await mkdir(uploadDir, { recursive: true });

    const fileName = `payout-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/payouts/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error("[API Error] upload-qr:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to upload image" }, { status: 500, headers: corsHeaders });
  }
}
