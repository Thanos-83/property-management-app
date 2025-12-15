import { getAurinkoAuthUrl } from '@/lib/aurinko';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const loginHint = searchParams.get('loginHint') || null;

    const url = getAurinkoAuthUrl('Google', loginHint);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Failed to generate Aurinko URL', error);
    return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 });
  }
}
