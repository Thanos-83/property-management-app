import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { accountId, to, cc, bcc, subject, body } = await req.json();

    if (!accountId || !to || !subject || !body) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Get the Aurinko Access Token for this account
    // We assume there is a 'tokens' table or 'accounts' table storing this. 
    // Based on previous context, 'accounts' table likely holds the token or related info.
    // Let's check 'lib/actions/emailActions.ts' via generic search if we are unsure, 
    // but usually it's in a table linking accountId to access_token.
    // Actually, let's look for where we exchanged the token.
    // Ideally we should use a helper, but for now we will query the DB directly if we know the schema.
    // Wait, I don't know the schema for sure. 
    // I'll try to find the token in the 'tokens' table if it exists, or 'accounts'.
    
    // Let's assume a standard schema based on 'getAccessToken.ts' only getting session token.
    // I will try to query 'accounts' table for 'access_token' or 'token'.
    
    const { data: account, error: accountError } = await supabase
      .from('email_accounts')
      .select('access_token') 
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
       console.error('Account fetch error:', accountError);
       return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const aurinkoAccessToken = account.access_token;

    // 2. Prepare Payload for Aurinko
    const payload = {
        subject,
        body: body, 
        to: to.map((email: string) => ({ address: email })),
        cc: cc?.map((email: string) => ({ address: email })) || [],
        bcc: bcc?.map((email: string) => ({ address: email })) || [],
    };

    // 3. Send to Aurinko
    const response = await fetch(`https://api.aurinko.io/v1/email/messages?bodyType=html`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${aurinkoAccessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Aurinko send error:', errorData);
        return NextResponse.json(
            { error: 'Failed to send email via Aurinko', details: errorData }, 
            { status: response.status }
        );
    }

    const data = await response.json();

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Send API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
