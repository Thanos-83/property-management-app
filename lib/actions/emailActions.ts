'use server';

import { createClient } from '../utils/supabase/server';
import DOMPurify from 'isomorphic-dompurify';
import { getAurinkoAuthUrl as getAuthUrl } from '../aurinko';

// import { extractBookingDetails } from '@/lib/ai/gemini';

export interface EmailSummary {
  id: string;
  threadId: string;
  subject: string;
  from: { name: string; address: string };
  receivedAt: string; // ISO Date string
  bodySnippet: string; // A short preview of the body
  sysClassifications: Array<string>;
  sysLabels: Array<string>;
}

/**
 * Get Aurinko OAuth URL for connecting an email account
 */
export async function getAurinkoAuthUrl(provider: 'Google' | 'Office365' = 'Google'): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const authUrl = getAuthUrl(provider);
    return { success: true, data: authUrl };
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return { success: false, error: 'Failed to generate authentication URL' };
  }
}


export async function syncEmails(
  accountId: string,
  folder: string = 'inbox',
  search?: string
): Promise<{ success: boolean; data?: EmailSummary[]; error?: string }> {
  const supabase = await createClient();

  // 1. Fetch the access token securely
  const { data: account } = await supabase
    .from('email_accounts')
    .select('access_token')
    .eq('id', accountId)
    .single();

  if (!account) return { success: false, error: 'Account not found' };

  try {
    // 2. Call Aurinko List Messages Endpoint
    // Map our folder names to Aurinko/System names if needed
    // For now, we use simple mapping.
    let folderQuery = `in:${folder}`;
    if (folder === 'sent') folderQuery = 'in:sent';
    if (folder === 'trash') folderQuery = 'in:trash';
    if (folder === 'archive') folderQuery = 'in:archive';
    if (folder === 'junk') folderQuery = 'in:junk';

    if (search) {
      folderQuery += ` ${search}`;
    }

    const params = new URLSearchParams({
      q: folderQuery,
      limit: '20', // Increased limit for better UI
    });

    const response = await fetch(
      `https://api.aurinko.io/v1/email/messages?${params}`,
      {
        headers: { Authorization: `Bearer ${account.access_token}` },
        next: { revalidate: 0 }, // Cache for 60 seconds
      }
    );


    if (!response.ok) {
      console.error('Aurinko Error:', response.statusText);
      return { success: false, error: 'Failed to fetch emails' };
    }

    const { records } = await response.json();


    // 3. Map to our clean interface
    // Aurinko returns nested objects; we flatten them for the UI
    const emails: EmailSummary[] = records.map((msg: EmailSummary) => ({
      id: msg.id,
      threadId: msg.threadId,
      subject: msg.subject || '(No Subject)',
      from: msg.from || { name: 'Unknown', address: 'unknown' },
      receivedAt: msg.receivedAt,
      bodySnippet: msg.bodySnippet, // The short text preview
      sysClassifications: msg.sysClassifications,
      sysLabels: msg.sysLabels,
    }));

    // 4. Lazy Sync: Upsert to Supabase (Metadata Only)
    // We don't await this to keep the UI snappy, OR we await it to ensure consistency.
    // Given it's a batch upsert, it should be fast. Let's await it to be safe.
    const { error: upsertError } = await supabase.from('emails').upsert(
      emails.map((e) => ({
        id: e.id,
        account_id: accountId,
        thread_id: e.threadId,
        subject: e.subject,
        from_json: e.from,
        snippet: e.bodySnippet,
        received_at: e.receivedAt,
        folder: folder, // Note: This might be inexact if we search across folders, but good enough for now
        is_read: !e.sysLabels.includes('unread'),
        updated_at: new Date().toISOString(),
      })),
      { onConflict: 'id' }
    );

    if (upsertError) {
      console.error('Failed to sync emails to DB:', upsertError);
      // We don't fail the request, just log the error
    }

    return { success: true, data: emails };
  } catch (error) {
    console.error('Sync Error:', error);
    return { success: false, error: 'Internal Server Error' };
  }
}

export async function getEmailsFromDB(
  accountId: string,
  folder: string = 'inbox',
  search?: string
): Promise<{ success: boolean; data?: EmailSummary[]; error?: string }> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('emails')
      .select('*')
      .eq('account_id', accountId)
      .eq('folder', folder)
      .order('received_at', { ascending: false });

    if (search) {
      query = query.or(`subject.ilike.%${search}%,snippet.ilike.%${search}%,from_json->>name.ilike.%${search}%,from_json->>address.ilike.%${search}%`);
    }

    const { data, error } = await query;

    
    if (error) {
      console.error('DB Fetch Error:', error);
      return { success: false, error: 'Failed to fetch emails from DB' };
    }

    // Handle case where data is null or undefined
    if (!data) {
      console.log('DB returned null/undefined, returning empty array');
      return { success: true, data: [] };
    }

    // Map back to EmailSummary interface
    const emails: EmailSummary[] = data.map((record) => ({
      id: record.id,
      threadId: record.thread_id,
      subject: record.subject,
      from: record.from_json,
      receivedAt: record.received_at,
      bodySnippet: record.snippet,
      sysClassifications: [],
      sysLabels: record.is_read ? ['seen'] : ['unread'],
    }));

    
    // Force clean JSON serialization to ensure proper transport to client
    const result = { success: true as const, data: emails };
    return JSON.parse(JSON.stringify(result));
  } catch (err) {
    console.error('getEmailsFromDB unexpected error:', err);
    return { success: false, error: 'Unexpected error fetching emails' };
  }
}

export async function syncRecentEmails(accountId: string) {
  const supabase = await createClient();

  console.log(`🔄 Starting sync for account: ${accountId}`);

  // 1. Fetch the token from DB
  // We need the Aurinko Account ID to link data later, and the Access Token to fetch data now.
  const { data: account, error } = await supabase
    .from('email_accounts')
    .select('access_token, aurinko_account_id')
    .eq('id', accountId)
    .single();

  if (error || !account) {
    console.error('❌ DB Error:', error);
    throw new Error('Account not found');
  }

  // 2. Fetch the list of recent messages (Summary View)
  // We limit to the last 30 days to avoid processing years of history.
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - 30);
  const dateQuery = daysAgo.toISOString().split('T')[0].replace(/-/g, '/'); // YYYY/MM/DD

  const params = new URLSearchParams({
    q: `after:${dateQuery}`,
    limit: '3', // Start small (10) for testing, increase later
    returnIds: 'false',
  });

  console.log(`📡 Fetching message list from Aurinko...`);

  const response = await fetch(
    `https://api.aurinko.io/v1/email/messages?${params}`,
    {
      headers: {
        Authorization: `Bearer ${account.access_token}`,
      },
    }
  );

  if (response.status === 403) {
    console.error(
      '🛑 Aurinko 403: Gmail API likely not enabled or scopes invalid.'
    );
    return { success: false, error: 'Permission Denied' };
  }

  if (!response.ok) {
    console.error('Aurinko List Error:', await response.text());
    throw new Error('Failed to fetch email list');
  }

  const { records: emailSummaries } = await response.json();
  console.log(`✅ Found ${emailSummaries.length} emails. Processing...`);

  // 3. Process each email individually
  let processedCount = 0;
  for (const summary of emailSummaries) {
    // We pass the token we already have to avoid re-fetching it
    await processEmailForBookings(summary, account.access_token);
    processedCount++;
  }

  return { success: true, count: processedCount };
}

// ------------------------------------------------------------------
// 🧠 The Core Logic: Fetch Full Body -> AI Extraction
// ------------------------------------------------------------------
async function processEmailForBookings(
  messageSummary: any,
  accessToken: string
) {
  // Step A: Fetch the FULL Email Content
  // The summary often omits the body or truncates it. We need the full HTML for the AI.
  const response = await fetch(
    `https://api.aurinko.io/v1/email/messages/${messageSummary.id}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    console.warn(`⚠️ Failed to fetch full body for ${messageSummary.id}`);
    return;
  }

  const fullEmail = await response.json();

  // Step B: Select the best content for AI
  // Prefer Plain Text (cheaper/cleaner), fallback to HTML if Text is missing.
  // Note: Booking platforms often hide details in HTML tables, so HTML is actually safer for this use case.
  const emailBody = fullEmail.body?.content || fullEmail.body?.text || '';

  if (!emailBody || emailBody.length < 50) {
    console.log(`⏩ Skipping "${fullEmail.subject}" (Body too short or empty)`);
    return;
  }

  console.log(`🤖 Sending to Gemini: "${fullEmail.subject}"`);

  // Step C: AI Extraction
  //   const extractedData = await extractBookingDetails(
  //     emailBody,
  //     fullEmail.subject
  //   );

  // Step D: Handling the Result
  //   if (!extractedData) {
  //     console.log(`⚪ No booking data found in: "${fullEmail.subject}"`);
  //     return;
  //   }

  // --- SUCCESS! We found a booking. ---
  //   console.log('--------------------------------------------------');
  //   console.log('🎉 BOOKING DETECTED!');
  //   console.log(`👤 Guest: ${extractedData.guest_name}`);
  //   console.log(
  //     `💰 Price: ${extractedData.total_price} ${extractedData.currency || 'EUR'}`
  //   );
  //   console.log(
  //     `📅 Dates: ${extractedData.check_in_date} -> ${extractedData.check_out_date}`
  //   );
  //   console.log(`🔢 Guests: ${extractedData.guest_count}`);
  //   console.log(`🆔 Platform ID: ${extractedData.confirmation_code}`);
  //   console.log('--------------------------------------------------');

  // 2. UPDATE that booking with this rich data
}

export async function getConnectedAccounts() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { data: accounts, error } = await supabase
    .from('email_accounts')
    .select('id, email_address, provider, created_at')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching accounts:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data: accounts };
}

