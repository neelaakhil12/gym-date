import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const result = await query("SELECT key, value, description FROM platform_config ORDER BY key ASC");
    let configs = result.rows || [];

    const defaultConfigs = [
      ['platform_commission', '10', 'Global platform commission percentage (fallback for all gyms).'],
      ['gst_percentage', '18', 'Goods & Services Tax (GST %) charged on user subscription purchases. Set to 0 to disable GST.'],
      ['user_referral_bonus', '10', 'Amount given to a user when they refer a friend (credited upon subscription payment)'],
      ['partner_referral_bonus', '500', 'Referral bonus (in ₹) credited to gym partner wallet when an invited gym lead is approved by Super Admin.'],
      ['max_wallet_per_txn', '10', 'Maximum wallet amount (in ₹) that can be deducted per booking transaction.'],
      ['partner_referral_min_withdrawal', '1500', 'Minimum withdrawal amount limit (in ₹) for Gym Partner Referral Wallet.'],
      ['partner_virtual_min_withdrawal', '500', 'Minimum withdrawal amount limit (in ₹) for Gym Partner Virtual Wallet (Revenue).'],
      ['allow_staff_settings', 'false', 'Enable or disable Settings tab visibility for operations staff.']
    ];

    for (const [k, v, desc] of defaultConfigs) {
      if (!configs.find((c: any) => c.key === k)) {
        await query(
          "INSERT INTO platform_config (key, value, description) VALUES ($1, $2, $3) ON CONFLICT (key) DO NOTHING",
          [k, v, desc]
        );
      }
    }

    const updated = await query("SELECT key, value, description FROM platform_config ORDER BY key ASC");
    const safeData = (updated.rows || []).map((row: any) => ({
      key: String(row.key || ''),
      value: String(row.value ?? ''),
      description: String(row.description ?? '')
    }));

    return NextResponse.json({ success: true, configs: safeData }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error: any) {
    console.error("Error in settings-config API:", error);
    return NextResponse.json({ success: false, error: error.message, configs: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { key, value } = await req.json();
    if (!key) {
      return NextResponse.json({ success: false, error: "Key is required" }, { status: 400 });
    }

    try {
      await query("ALTER TABLE platform_config ALTER COLUMN value TYPE TEXT");
      await query("ALTER TABLE platform_config ALTER COLUMN description TYPE TEXT");
    } catch (e) {}

    await query(
      `INSERT INTO platform_config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2`,
      [key, String(value ?? '')]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error saving setting:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
