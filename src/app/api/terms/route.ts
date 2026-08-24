import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { DEFAULT_USER_TERMS, DEFAULT_PARTNER_TERMS } from '@/lib/termsData';

export const dynamic = 'force-dynamic';

async function ensurePlatformConfigTextColumns() {
  try {
    await query("ALTER TABLE platform_config ALTER COLUMN value TYPE TEXT");
    await query("ALTER TABLE platform_config ALTER COLUMN description TYPE TEXT");
  } catch (e: any) {
    // Ignore if already text
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensurePlatformConfigTextColumns();
    const result = await query(
      "SELECT key, value FROM platform_config WHERE key IN ('user_terms_conditions', 'partner_terms_conditions', 'terms_updated_at')"
    );
    const rows = result.rows || [];

    const userTermsRow = rows.find((r: any) => r.key === 'user_terms_conditions');
    const partnerTermsRow = rows.find((r: any) => r.key === 'partner_terms_conditions');
    const updatedAtRow = rows.find((r: any) => r.key === 'terms_updated_at');

    const userTerms = userTermsRow?.value || DEFAULT_USER_TERMS;
    const partnerTerms = partnerTermsRow?.value || DEFAULT_PARTNER_TERMS;
    const updatedAt = updatedAtRow?.value || '24 August 2026';

    return NextResponse.json({
      success: true,
      userTerms,
      partnerTerms,
      updatedAt
    });
  } catch (error: any) {
    console.error("Error fetching terms:", error);
    return NextResponse.json({
      success: true,
      userTerms: DEFAULT_USER_TERMS,
      partnerTerms: DEFAULT_PARTNER_TERMS,
      updatedAt: '24 August 2026'
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensurePlatformConfigTextColumns();
    const body = await req.json();
    const { userTerms, partnerTerms, key, value } = body;

    const nowStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    if (key && value !== undefined) {
      await query(
        `INSERT INTO platform_config (key, value, description) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (key) DO UPDATE SET value = $2`,
        [key, String(value), key === 'user_terms_conditions' ? 'User Terms & Conditions' : 'Gym Partner Terms & Conditions']
      );
    }

    if (userTerms !== undefined) {
      await query(
        `INSERT INTO platform_config (key, value, description) 
         VALUES ('user_terms_conditions', $1, 'User Terms & Conditions') 
         ON CONFLICT (key) DO UPDATE SET value = $1`,
        [String(userTerms)]
      );
    }

    if (partnerTerms !== undefined) {
      await query(
        `INSERT INTO platform_config (key, value, description) 
         VALUES ('partner_terms_conditions', $1, 'Gym Partner Terms & Conditions') 
         ON CONFLICT (key) DO UPDATE SET value = $1`,
        [String(partnerTerms)]
      );
    }

    await query(
      `INSERT INTO platform_config (key, value, description) 
       VALUES ('terms_updated_at', $1, 'Last updated date of terms') 
       ON CONFLICT (key) DO UPDATE SET value = $1`,
      [nowStr]
    );

    return NextResponse.json({ success: true, message: 'Terms and Conditions updated successfully!', updatedAt: nowStr });
  } catch (error: any) {
    console.error("Error saving terms:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
