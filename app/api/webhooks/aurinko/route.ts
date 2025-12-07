import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';
import { createServiceClient } from '@/lib/utils/supabase/supabaseDB';
import crypto from 'crypto';

// Webhook secret for signature verification
const WEBHOOK_SECRET = process.env.AURINKO_WEBHOOK_SECRET;

/**
 * Verify Aurinko webhook signature
 */
function verifySignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) {
    console.error('AURINKO_WEBHOOK_SECRET is not set');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return signature === expectedSignature;
}

/**
 * Handle Aurinko webhook POST requests
 */
export async function POST(request: NextRequest) {
  console.log('🔔 Webhook received');
  
  try {
    // Check for Aurinko's validation token in query params
    const { searchParams } = new URL(request.url);
    const validationToken = searchParams.get('validationToken');
    
    if (validationToken) {
      console.log('✅ Responding to validation token:', validationToken);
      // Return plain text, not JSON
      return new NextResponse(validationToken, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const body = await request.text();
    console.log('📦 Webhook body:', body);
    
    // Only parse if there's a body
    if (!body) {
      console.error('Empty webhook body');
      return NextResponse.json({ error: 'Empty body' }, { status: 400 });
    }

    let payload;
    try {
      payload = JSON.parse(body);
    } catch (e) {
      console.error('Failed to parse webhook body:', e);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Handle URL verification challenge (alternative format)
    if (payload.challenge) {
      console.log('✅ Responding to challenge:', payload.challenge);
      return NextResponse.json({ challenge: payload.challenge });
    }

    // For actual webhook notifications, verify signature if present
    // TODO: Fix signature verification - temporarily disabled for testing
    const signature = request.headers.get('x-aurinko-signature');
    console.log('Signature header:', signature);
    console.log('⚠️ Signature verification disabled for testing');
    
    // if (signature && process.env.AURINKO_WEBHOOK_SECRET) {
    //   if (!verifySignature(body, signature)) {
    //     console.error('Invalid webhook signature');
    //     return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    //   }
    //   console.log('✅ Signature verified');
    // }

    // Handle email notification
    // Aurinko sends payloads as an array in the webhook
    if (payload.resource === '/email/messages' && payload.payloads && payload.payloads.length > 0) {
      console.log('📧 Email notification received');
      console.log('📧 Email Payload', payload);
      console.log('📧 Email Payload', payload.payloads[0].attributes);
      for (const emailPayload of payload.payloads) {
        if (emailPayload.changeType === 'created') {
          await handleNewEmail(payload.accountId, emailPayload);
        } else if (emailPayload.changeType === 'updated') {
          await handleEmailUpdate(payload.accountId, emailPayload);
        } else if (emailPayload.changeType === 'deleted') {
          await handleEmailDeletion(payload.accountId, emailPayload);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Process new email notification and insert into database
 */
async function handleNewEmail(aurinkoAccountId: number, emailPayload: any) {
  // Use service role client to bypass RLS for webhook processing
  const supabase = createServiceClient();

  console.log('Processing email:', emailPayload);
  console.log('Looking up account with Aurinko ID:', aurinkoAccountId, 'Type:', typeof aurinkoAccountId);

  // Get account ID from Aurinko account ID
  // Convert to string in case the DB column is text
  const { data: account, error: accountError } = await supabase
    .from('email_accounts')
    .select('id, access_token')
    .eq('aurinko_account_id', String(aurinkoAccountId))
    .single();

  console.log('Account lookup result:', { account, error: accountError });

  if (accountError || !account) {
    console.error('Account not found for Aurinko ID:', aurinkoAccountId, 'Error:', accountError);
    return;
  }

  // Fetch full email details from Aurinko
  const messageId = emailPayload.id;
  const response = await fetch(
    `https://api.aurinko.io/v1/email/messages/${messageId}`,
    {
      headers: { Authorization: `Bearer ${account.access_token}` },
    }
  );

  if (!response.ok) {
    console.error('Failed to fetch email details from Aurinko');
    return;
  }

  const emailData = await response.json();

  // Determine the correct folder based on email properties
  let folder = 'inbox'; // default
  
  // Check if this is a sent email
  if (emailData.sysLabels?.includes('sent') || emailData.folder === 'sent') {
    folder = 'sent';
  } else if (emailData.sysLabels?.includes('trash') || emailData.folder === 'trash') {
    folder = 'trash';
  } else if (emailData.sysLabels?.includes('spam') || emailData.folder === 'spam') {
    folder = 'spam';
  } else if (emailData.sysLabels?.includes('draft') || emailData.folder === 'draft') {
    folder = 'drafts';
  } else if (emailData.folder) {
    // Use the folder from Aurinko if available
    folder = emailData.folder;
  }

  console.log('Email folder detected:', folder, 'Labels:', emailData.sysLabels);

  // Insert email metadata into database
  const { error } = await supabase.from('emails').upsert(
    {
      id: emailData.id,
      account_id: account.id,
      thread_id: emailData.threadId,
      subject: emailData.subject || '(No Subject)',
      from_json: emailData.from || { name: 'Unknown', address: 'unknown' },
      snippet: emailData.bodySnippet || '',
      received_at: emailData.receivedAt,
      folder: folder, // Use detected folder
      is_read: !emailData.sysLabels?.includes('unread'),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) {
    console.error('Failed to insert email into database:', error);
  } else {
    console.log('✅ New email inserted:', emailData.subject, 'in folder:', folder);
  }
}

/**
 * Handle email updates (read/unread, folder moves, etc.)
 */
async function handleEmailUpdate(aurinkoAccountId: number, emailPayload: any) {
  const supabase = createServiceClient();
  
  console.log('🔄 Updating email:', emailPayload);

  const { data: account } = await supabase
    .from('email_accounts')
    .select('id, access_token')
    .eq('aurinko_account_id', String(aurinkoAccountId))
    .single();

  if (!account) {
    console.error('Account not found for update');
    return;
  }

  // Fetch updated email details
  const messageId = emailPayload.id;
  const response = await fetch(
    `https://api.aurinko.io/v1/email/messages/${messageId}`,
    {
      headers: { Authorization: `Bearer ${account.access_token}` },
    }
  );

  if (!response.ok) {
    console.error('Failed to fetch updated email details');
    return;
  }

  const emailData = await response.json();

console.log('🔄 Updated email sysLabels:', emailData.sysLabels);
console.log('🔄 Updated email folder:', emailData.folder);
console.log('🔄 Updated email unread:', emailData.sysLabels?.includes('unread'));
console.log('🔄 Updated email read:', !emailData.attachments);
  // Determine folder (same logic as creation)  
  let folder = 'inbox';
  if (emailData.sysLabels?.includes('sent')) {
    folder = 'sent';
  } else if (emailData.sysLabels?.includes('trash')) {
    folder = 'trash';
  } else if (emailData.sysLabels?.includes('spam')) {
    folder = 'spam';
  } else if (emailData.sysLabels?.includes('draft')) {
    folder = 'drafts';
  } else if (emailData.folder) {
    folder = emailData.folder;
  }

  // Update the email in database
  const { error } = await supabase
    .from('emails')
    .update({
      folder: folder,
      is_read: !emailData.sysLabels?.includes('unread'),
      updated_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .eq('account_id', account.id);

  if (error) {
    console.error('Failed to update email:', error);
  } else {
    console.log('✅ Email updated:', emailData.subject, 'Folder:', folder, 'Read:', !emailData.sysLabels?.includes('unread'));
  }
}

/**
 * Handle email deletions
 */
async function handleEmailDeletion(aurinkoAccountId: number, emailPayload: any) {
  const supabase = createServiceClient();
  
  console.log('🗑️ Deleting email:', emailPayload);

  const { data: account } = await supabase
    .from('email_accounts')
    .select('id')
    .eq('aurinko_account_id', String(aurinkoAccountId))
    .single();

  if (!account) {
    console.error('Account not found for deletion');
    return;
  }

  const messageId = emailPayload.id;

  // Delete the email from database
  const { error } = await supabase
    .from('emails')
    .delete()
    .eq('id', messageId)
    .eq('account_id', account.id);

  if (error) {
    console.error('Failed to delete email:', error);
  } else {
    console.log('✅ Email deleted:', messageId);
  }
}
