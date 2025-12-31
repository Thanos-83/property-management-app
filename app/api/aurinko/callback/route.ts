import { createClient } from '@/lib/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { performInitialSync } from '@/lib/utils/sync/aurinkoEmailSync';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const status = searchParams.get('status');

  // 1. Check for errors from Aurinko
  if (status !== 'success' || !code) {
    return NextResponse.json(
      { error: 'Connection failed or cancelled' },
      { status: 400 }
    );
  }

  try {
    // 2. Exchange Code for Access Token
    const authString = Buffer.from(
      `${process.env.AURINKO_CLIENT_ID}:${process.env.AURINKO_CLIENT_SECRET}`
    ).toString('base64');

    console.log('Aurinko code: ', code);
    console.log('Aurinko auth sctring: ', authString);
    const tokenResponse = await fetch(
      `https://api.aurinko.io/v1/auth/token/${code}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authString}`,
          'Content-Type': 'application/json', // Aurinko expects empty body for this endpoint usually, but headers matter
        },
      }
    );

    console.log('Aurinko token response: ', tokenResponse);

    const tokenData = await tokenResponse.json();

    // Note: Aurinko manages the refresh token internally if the "Keep all tokens refreshed" setting is enabled in the Aurinko Portal.
    // Therefore, we may not receive a 'refreshToken' in this response, and that is expected.


    if (!tokenResponse.ok) {
      console.error('Aurinko Token Error:', tokenData);
      return NextResponse.json(
        { error: 'Failed to retrieve access token' },
        { status: 400 }
      );
    }
    
    // Robust token extraction: Aurinko V1 usually sends camelCase, but OAuth2 is snake_case. catch both.
    const accessToken = tokenData.accessToken || tokenData.access_token;
    const refreshToken = tokenData.refreshToken || tokenData.refresh_token;
    const accountId = tokenData.accountId || tokenData.account_id || tokenData.id;

    console.log('Extracted Tokens:', { hasAccess: !!accessToken, hasRefresh: !!refreshToken, accountId });

    // The token response didn't have them, so we ask the Account API.
    const accountResponse = await fetch('https://api.aurinko.io/v1/account', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const accountDetails = await accountResponse.json();

    if (!accountResponse.ok) {
      console.error('Aurinko Account Error:', accountDetails);
      return NextResponse.json(
        { error: 'Failed to fetch account details' },
        { status: 400 }
      );
    }
    console.log('Aurinko account details: ', accountDetails);

    console.log('Aurinko token data: ', tokenData);

    // 3. Get User Session
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // 4. Save to Database
    // FIRST: Check if this email already exists for this user to avoid duplicates
    const { data: existingAccount } = await supabase
      .from('email_accounts')
      .select('id, refresh_token')
      .eq('user_id', user.id)
      .eq('email_address', accountDetails.email)
      .single();
    
    let dbError;
    
    if (existingAccount) {
      console.log('Using existing account:', existingAccount.id);
      
      const updates: any = {
        aurinko_account_id: accountId, // Update ID in case it changed
        access_token: accessToken,
        provider: accountDetails.serviceType,
        is_active: true,
        updated_at: new Date().toISOString(),
      };
      
      // key fix: Only update refresh token if we got a new one
      if (refreshToken) {
        updates.refresh_token = refreshToken;
      }
      
      const { error } = await supabase
        .from('email_accounts')
        .update(updates)
        .eq('id', existingAccount.id);
        
      dbError = error;
    } else {
      console.log('Creating new account mapping');
      const { error } = await supabase.from('email_accounts').upsert(
        {
          user_id: user.id,
          aurinko_account_id: accountId,
          provider: accountDetails.serviceType, // 'Google' or 'Office365'
          email_address: accountDetails.email, // Aurinko usually returns the connected email
          access_token: accessToken,
          refresh_token: refreshToken, // Store this for long-term access
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id, aurinko_account_id' }
      );
      dbError = error;
    }

    if (dbError) {
      console.error('Supabase Error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save account details' },
        { status: 500 }
      );
    }

    // NEW: Get the account ID we just created/updated
    const { data: accountData } = await supabase
      .from('email_accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('aurinko_account_id', accountId)
      .single();

    // 5. Perform Initial Sync (Reconcile)
    if (accountData?.id) {
      try {
        await performInitialSync(accessToken, accountId, accountData.id);
      } catch (error) {
        console.error('Initial sync failed (non-fatal):', error);
        // We continue to redirect even if sync fails, as the webhook will pick up future events
      }
    }

    // 6. Success! Redirect to email page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/email?success=account_connected`
    );
  } catch (error) {
    console.error('Callback Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
