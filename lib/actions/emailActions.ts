'use server';

import { createClient } from '../utils/supabase/server';
// import DOMPurify from 'isomorphic-dompurify';
import { getAurinkoAuthUrl as getAuthUrl } from '../aurinko';
import { performInitialSync } from '../utils/sync/aurinkoEmailSync';
import { revalidatePath } from 'next/cache';
const { refreshAurinkoToken } = await import('../utils/refreshAuth');

// import { extractBookingDetails } from '@/lib/ai/gemini';

// ------------------------------------------------------------------
// 🧠 The Core Logic: Fetch Full Body -> AI Extraction
import { processEmailForBookings } from '@/lib/utils/emailParsing';

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
export async function getAurinkoAuthUrl(
  provider: 'Google' | 'Office365' = 'Google',
): Promise<{ success: boolean; data?: string; error?: string }> {
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
  search?: string,
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
      },
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
      { onConflict: 'id' },
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
  search?: string,
): Promise<{ success: boolean; data?: EmailSummary[]; error?: string }> {
  try {
    const supabase = await createClient();
    // create a delay of # seconds
    await new Promise((resolve) => setTimeout(resolve, 1000));
    let query = supabase
      .from('emails')
      .select('*')
      .eq('account_id', accountId)
      .eq('folder', folder)
      .order('received_at', { ascending: false });

    if (search) {
      query = query.or(
        `subject.ilike.%${search}%,snippet.ilike.%${search}%,from_json->>name.ilike.%${search}%,from_json->>address.ilike.%${search}%`,
      );
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

// 1. Helper function for delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function syncRecentEmails(accountId: string) {
  const supabase = await createClient();

  console.log(`🔄 Starting sync for account: ${accountId}`);

  // 1. Fetch the token from DB
  // We need the Aurinko Account ID to link data later, and the Access Token to fetch data now.
  const { data: account, error } = await supabase
    .from('email_accounts')
    .select('user_id, access_token, aurinko_account_id')
    .eq('id', accountId)
    .single();

  if (error || !account) {
    console.error('❌ DB Error:', error);
    throw new Error('Account not found');
  }

  // 2. Fetch the list of recent messages (Summary View)
  // We limit to the last 60 days to avoid processing years of history.
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - 60);
  const dateQuery = daysAgo.toISOString().split('T')[0].replace(/-/g, '/'); // YYYY/MM/DD

  const params = new URLSearchParams({
    q: `after:${dateQuery}`,
    limit: '3', // Start small (10) for testing, increase later
    returnIds: 'false',
  });

  console.log(`📡 Fetching emails list from Aurinko...`);

  // 2. Fetch the list of recent messages (Summary View)
  const fetchMessages = async (token: string) => {
    return await fetch(`https://api.aurinko.io/v1/email/messages?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  let response = await fetchMessages(account.access_token);

  // --- AUTOMATIC TOKEN REFRESH LOGIC ---
  if (response.status === 401 || response.status === 403) {
    console.warn(
      `⚠️ Token expired (Status ${response.status}). Attempting refresh...`,
    );
    try {
      const newToken = await refreshAurinkoToken(accountId);
      console.log('🔄 Token refreshed. Retrying fetch...');
      response = await fetchMessages(newToken);
      // Update local token variable if needed for subsequent calls?
      // Actually we need to pass the new token to 'processEmailForBookings' loop below.
      account.access_token = newToken;
    } catch (refreshErr) {
      console.error('🛑 Refresh failed:', refreshErr);
      // Disable account so UI can prompt user
      await supabase
        .from('email_accounts')
        .update({ is_active: false })
        .eq('id', accountId);
      return {
        success: false,
        error: 'Connection expired. Please reconnect your account.',
      };
    }
  }
  // -------------------------------------

  if (!response.ok) {
    console.error('Aurinko List Error:', await response.text());
    throw new Error('Failed to fetch email list');
  }

  const { records: emailSummaries } = await response.json();
  console.log(`✅ Found ${emailSummaries.length} emails. Processing...`);

  const bookingKeywords = [
    'reservation',
    'booking',
    'confirmed',
    'confirmation',
    'cancelled',
    'cancellation',
    'simulate',
    'simulation',
  ];

  // 3. Process each email individually
  let processedCount = 0;
  for (const summary of emailSummaries) {
    // --- AI ENRICHMENT TRIGGER FILTER ---
    const sender = summary.from?.address?.toLowerCase() || '';
    const subject = summary.subject?.toLowerCase() || '';

    const isBookingPlatform =
      sender.includes('airbnb.com') ||
      sender.includes('booking.com') ||
      sender.includes('vrbo.com') ||
      sender.includes('expedia.com');

    const hasBookingKeyword = bookingKeywords.some((keyword) =>
      subject.includes(keyword),
    );

    if (!isBookingPlatform && !hasBookingKeyword) {
      console.log(`⏩ Skipping "${summary.subject}" - Not a booking email.`);
      processedCount++;
      continue;
    }

    // Add delay BEFORE processing
    // 4000ms = 4 seconds. This keeps you under ~15 RPM safely.
    // If you still hit limits, increase to 10000 (10s).
    await delay(6000); // Add a delay between emails

    // We pass the token we already have to avoid re-fetching it
    await processEmailForBookings(
      summary,
      account.access_token,
      account.user_id,
    );
    processedCount++;
  }

  return { success: true, count: processedCount };
}

/**
 * Manually trigger a full sync for an account.
 * Revalidates the email dashboard to show changes instantly.
 */
export async function syncEmailAccount(
  accountId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // 1. Auth Check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    // 2. Get Account Credentials
    const { data: account, error } = await supabase
      .from('email_accounts')
      .select('access_token, aurinko_account_id, id')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single();

    if (error || !account) {
      return { success: false, error: 'Account not found' };
    }

    // 3. Perform the Sync (start -> poll -> upsert/delete)
    await performInitialSync(
      account.access_token,
      account.aurinko_account_id,
      account.id,
    );

    // 4. Update UI automatically
    revalidatePath('/dashboard/email');

    return { success: true, error: '' };
  } catch (error) {
    console.error('Manual sync failed:', error);
    return { success: false, error: 'Sync failed. Please try again.' };
  }
}

export async function getFolderCounts(prevState: any, accountId: string) {
  const supabase = await createClient();
  const folders = ['inbox', 'sent', 'junk', 'trash', 'archive'];
  const counts: Record<string, number> = {
    inbox: 0,
    sent: 0,
    junk: 0,
    trash: 0,
    archive: 0,
  };

  // We can run these in parallel
  await Promise.all(
    folders.map(async (folder) => {
      const { count, error } = await supabase
        .from('emails')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId)
        .eq('folder', folder);

      if (!error && count !== null) {
        counts[folder] = count;
      }
    }),
  );

  return counts;
}
