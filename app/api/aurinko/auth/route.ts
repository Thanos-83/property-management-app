import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get('provider'); // 'Google' or 'Office365'

  if (!provider) {
    return NextResponse.json({ error: 'Missing provider' }, { status: 400 });
  }

  const clientId = process.env.AURINKO_CLIENT_ID;
  const redirectUri = `https://app.myapp.site:3000/api/aurinko/callback`;

  // Scopes required for a Communication Hub (Read, Send, Sync)
  // We use URL-encoded spaces (%20)
  const scopes = 'Mail.Read Mail.Send Mail.Drafts';

  if (!clientId) {
    return NextResponse.json(
      { error: 'Missing AURINKO_CLIENT_ID configuration' },
      { status: 500 }
    );
  }

  // Construct the Aurinko Auth URL
  // Note: We use 'returnUrl' as per Aurinko docs (not redirect_uri)
  //   const authUrl = `https://api.aurinko.io/v1/auth/authorize?clientId=${clientId}&serviceType=${provider}&scopes=${scopes}&responseType=code&returnUrl=${redirectUri}`;
  // Construct URL
  const authUrl = new URL('https://api.aurinko.io/v1/auth/authorize');
  authUrl.searchParams.set('clientId', clientId);
  authUrl.searchParams.set('serviceType', provider);
  authUrl.searchParams.set('scopes', scopes); // URLSearchParams will encode spaces as + or %20 automatically
  authUrl.searchParams.set('responseType', 'code');
  authUrl.searchParams.set('returnUrl', redirectUri);

  console.log('Auth url: ', authUrl);
  // Redirect the user to Aurinko
  return NextResponse.redirect(authUrl);
}
