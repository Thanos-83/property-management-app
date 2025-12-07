import { createClient } from '@/lib/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

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

    if (!tokenResponse.ok) {
      console.error('Aurinko Token Error:', tokenData);
      return NextResponse.json(
        { error: 'Failed to retrieve access token' },
        { status: 400 }
      );
    }

    // 2. NEW STEP: Fetch Account Details (Email & Provider)
    // The token response didn't have them, so we ask the Account API.
    const accountResponse = await fetch('https://api.aurinko.io/v1/account', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tokenData.accessToken}`,
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
    const { error: dbError } = await supabase.from('email_accounts').upsert(
      {
        user_id: user.id,
        aurinko_account_id: tokenData.accountId,
        provider: accountDetails.serviceType, // 'Google' or 'Office365'
        email_address: accountDetails.email, // Aurinko usually returns the connected email
        access_token: tokenData.accessToken,
        // refresh_token: tokenData.refreshToken, // Store this for long-term access
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id, aurinko_account_id' }
    );

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
      .eq('aurinko_account_id', tokenData.accountId)
      .single();

    // 5. Sync initial emails from inbox, sent, and trash folders
    if (accountData?.id) {
      const folders = ['inbox', 'sent', 'trash'];
      
      // Await the sync to ensure emails are loaded before redirect
      await Promise.all(
        folders.map(async (folder) => {
          try {
            const response = await fetch(
              `https://api.aurinko.io/v1/email/messages?q=in:${folder}&limit=50`,
              {
                headers: { Authorization: `Bearer ${tokenData.accessToken}` },
              }
            );
            
            if (response.ok) {
              const messages = await response.json();
              
              // Batch upsert emails
              if (messages.records && messages.records.length > 0) {
                const { error } = await supabase.from('emails').upsert(
                  messages.records.map((msg: any) => ({
                    id: msg.id,
                    account_id: accountData.id,
                    thread_id: msg.threadId,
                    subject: msg.subject || '(No Subject)',
                    from_json: msg.from || { name: 'Unknown', address: 'unknown' },
                    snippet: msg.bodySnippet || '',
                    received_at: msg.receivedAt,
                    folder: folder,
                    is_read: !msg.sysLabels?.includes('unread'),
                    updated_at: new Date().toISOString(),
                  })),
                  { onConflict: 'id' }
                );
                
                if (error) {
                  console.error('Failed to sync emails:', error);
                }
              }
            }
          } catch (error) {
            console.error('Email sync error:', error);
          }
        })
      );
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
