import { createServiceClient } from '@/lib/utils/supabase/supabaseDB';

/**
 * Refreshes the Aurinko access token for a given account.
 */
export async function refreshAurinkoToken(accountId: string) {
  const supabase = createServiceClient();

  // 1. Get the refresh token
  const { data: account, error } = await supabase
    .from('email_accounts')
    .select('refresh_token, aurinko_account_id')
    .eq('id', accountId)
    .single();

  if (error || !account || !account.refresh_token) {
    console.error(
      '❌ Cannot refresh token: Missing refresh_token in DB',
      error,
    );
    throw new Error('Missing refresh_token');
  }

  try {
    const authString = Buffer.from(
      `${process.env.AURINKO_CLIENT_ID}:${process.env.AURINKO_CLIENT_SECRET}`,
    ).toString('base64');

    // 2. Call Aurinko Token Endpoint
    const response = await fetch('https://api.aurinko.io/v1/auth/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: account.refresh_token,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('❌ Aurinko Refresh Failed:', errText);
      throw new Error(`Aurinko Refresh Failed: ${response.statusText}`);
    }

    const tokenData = await response.json();

    // 3. Update DB with new Access Token
    const { error: updateError } = await supabase
      .from('email_accounts')
      .update({
        access_token: tokenData.accessToken,
        updated_at: new Date().toISOString(),
      })
      .eq('id', accountId);

    if (updateError) {
      console.error('❌ Failed to update DB with new token:', updateError);
      throw new Error('DB Update Failed');
    }

    return tokenData.accessToken;
  } catch (error) {
    console.error('Refresh Logic Error:', error);
    throw error;
  }
}
