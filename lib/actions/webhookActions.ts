'use server';

import { createClient } from '../utils/supabase/server';

/**
 * Subscribe an email account to Aurinko webhooks
 */
export async function subscribeToWebhooks(accountId: string, webhookUrl: string) {
  const supabase = await createClient();

  // Get account details
  const { data: account, error: accountError } = await supabase
    .from('email_accounts')
    .select('access_token, aurinko_account_id')
    .eq('id', accountId)
    .single();

  if (accountError || !account) {
    return { success: false, error: 'Account not found' };
  }

  try {
    // Subscribe to Aurinko webhooks
    // Correct format based on Aurinko API
    const requestBody = {
      notificationUrl: webhookUrl,
      resource: '/email/messages',
      events: ['created'],
    };

    console.log('🔔 Subscribing to webhook:', {
      accountId,
      webhookUrl,
      aurinkoAccountId: account.aurinko_account_id,
      requestBody,
    });

    const response = await fetch('https://api.aurinko.io/v1/subscriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${account.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📡 Aurinko response:', response);
    const responseText = await response.text();
    console.log('📡 Aurinko response text:', {
      status: response.status,
      statusText: response.statusText,
      body: responseText,
    });

    if (!response.ok) {
      console.error('❌ Failed to subscribe to webhooks:', responseText);
      return { 
        success: false, 
        error: `Failed to create webhook subscription: ${response.status} ${responseText}` 
      };
    }

    const subscription = JSON.parse(responseText);
    
    console.log('✅ Webhook subscription created:', subscription);
    return { success: true, data: subscription };
  } catch (error) {
    console.error('Webhook subscription error:', error);
    return { success: false, error: 'Internal error' };
  }
}

/**
 * List all webhook subscriptions for an account
 */
export async function listWebhookSubscriptions(prevState: any, accountId: string) {
  const supabase = await createClient();

  // Get account details
  const { data: account } = await supabase
    .from('email_accounts')
    .select('access_token')
    .eq('id', accountId)
    .single();

  if (!account) {
    return { success: false, error: 'Account not found' };
  }

  try {
    const response = await fetch('https://api.aurinko.io/v1/subscriptions', {
      headers: {
        Authorization: `Bearer ${account.access_token}`,
      },
    });

    if (!response.ok) {
      return { success: false, error: 'Failed to list subscriptions', data: null };
    }

    const subscriptions = await response.json();
    // console.log('📡Server Subscriptions:', subscriptions);
    return { success: true, error: null, data: subscriptions };
  } catch (error) {
    console.error('List subscriptions error:', error);
    return { success: false, error: 'Internal error', data: null };
  }
}

/**
 * Delete a webhook subscription
 */
export async function deleteWebhookSubscription(prevState: any, { accountId, subscriptionId }: { accountId: string, subscriptionId: string }) {
  const supabase = await createClient();

  // Get account details
  const { data: account } = await supabase
    .from('email_accounts')
    .select('access_token')
    .eq('id', accountId)
    .single();

  if (!account) {
    return { success: false, error: 'Account not found' };
  }

  try {
    const response = await fetch(
      `https://api.aurinko.io/v1/subscriptions/${subscriptionId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${account.access_token}`,
        },
      }
    );

    if (!response.ok) {
      return { success: false, error: 'Failed to delete subscription' };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete subscription error:', error);
    return { success: false, error: 'Internal error' };
  }
}
