import { createServiceClient } from '@/lib/utils/supabase/supabaseDB';

interface SyncResponse {
  syncUpdatedToken: string;
  syncDeletedToken: string;
  ready: boolean;
}

interface AurinkoMessage {
  id: string;
  threadId: string;
  subject: string;
  from: { name: string; address: string };
  bodySnippet: string;
  receivedAt: string;
  folder: { id: string; name: string };
  sysLabels: string[];
}

interface AurinkoDeletedMessage {
  id: string;
}

export async function performInitialSync(
  accessToken: string,
  aurinkoAccountId: number,
  dbAccountId: number
) {
  const supabase = createServiceClient();
  console.log(`🔄 Starting initial sync for account ${aurinkoAccountId}...`);

  try {
    // 1. Start Sync (limit to last 30 days for initial load speed)
    let syncResponse = await startSync(accessToken, 360);
    

console.log(' 🔄 Sync Response', syncResponse);

    // 2. Poll until ready
    let attempts = 0;
    while (!syncResponse.ready && attempts < 10) {
      console.log(`⏳ Sync not ready, waiting... (Attempt ${attempts + 1})`);
      await new Promise(r => setTimeout(r, 1000)); // Wait 1s
      syncResponse = await startSync(accessToken, 360); // Re-check status
      attempts++;
    }

    if (!syncResponse.ready) {
      throw new Error('Sync failed to become ready after 10 seconds');
    }

    console.log('✅ Sync Ready! Fetching deltas...');

    // 3. Get Updated Messages (Inserts/Updates)
    await fetchAndUpsertMessages(accessToken, syncResponse.syncUpdatedToken, dbAccountId, supabase);

    // 4. Get Deleted Messages (Removals)
    await fetchAndDeleteMessages(accessToken, syncResponse.syncDeletedToken, dbAccountId, supabase);

    console.log('🎉 Initial Sync Complete');
    return { success: true };

  } catch (error) {
    console.error('❌ Initial sync failed:', error);
    throw error;
  }
}

async function startSync(accessToken: string, daysWithin: number): Promise<SyncResponse> {
  const response = await fetch(
    `https://api.aurinko.io/v1/email/sync?daysWithin=${daysWithin}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  // const folders = await fetch(
  //   `https://api.aurinko.io/v1/email/folders/TRASH/messages`,
  //   {
  //     headers: { Authorization: `Bearer ${accessToken}` },
  //   }
  // );

  // const foldersData = await folders.json();
  // console.log(' 🔄 Folders Data Trash length', foldersData);
  // console.log(' 🔄 Folders Data Trash records', foldersData.records[0]);

  if (!response.ok) {
    throw new Error(`Failed to start sync: ${response.statusText}`);
  }

  return await response.json();
}

async function fetchAndUpsertMessages(
  accessToken: string,
  syncUpdatedToken: string,
  dbAccountId: number,
  supabase: any
) {
  let pageToken: string | undefined = undefined;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams();
    if (pageToken) {
        params.append('pageToken', pageToken);
    } else {
        params.append('deltaToken', syncUpdatedToken);
    }

    const response = await fetch(
      `https://api.aurinko.io/v1/email/sync/updated?${params.toString()}&limit=50`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    // console.log('response', response);
    if (!response.ok) throw new Error('Failed to fetch updated messages');

    const data = await response.json();
    const messages: AurinkoMessage[] = data.records;

    if (messages.length > 0) {
      console.log(`📥 Upserting ${messages.length} messages...`);
      
      const mappedEmails = messages.map((msg) => {
            const labels = (msg.sysLabels || []).map(l => l.toLowerCase());
            let folder = 'archive';
            
            if (labels.includes('trash') || labels.includes('deleted')) folder = 'trash';
            else if (labels.includes('sent')) folder = 'sent';
            else if (labels.includes('junk') || labels.includes('spam')) folder = 'junk';
            else if (labels.includes('inbox')) folder = 'inbox';
            
            return {
              id: msg.id,
              account_id: dbAccountId,
              thread_id: msg.threadId,
              subject: msg.subject || '(No Subject)',
              from_json: msg.from || { name: 'Unknown', address: 'unknown' },
              snippet: msg.bodySnippet || '',
              received_at: msg.receivedAt,
              folder: folder,
              is_read: !labels.includes('unread'),
              updated_at: new Date().toISOString(),
            };
      });

      try {
        await upsertWithRetry(supabase, 'emails', mappedEmails);
      } catch (err) {
          console.error('Failed to upsert batch after retries', err);
          throw err; // Stop sync to prevent data gaps
      }
    }

    if (data.nextPageToken) {
      pageToken = data.nextPageToken; // Continue pagination if available
      // Throttle to prevent upstream timeouts (1s)
      await new Promise(r => setTimeout(r, 1000));
    } else {
      hasMore = false; // No more pages in this delta
    }
  }
}

// Helper for Robust Upserts
async function upsertWithRetry(supabase: any, table: string, data: any[], attempt = 1, maxAttempts = 3) {
    try {
        const { error } = await supabase.from(table).upsert(data, { onConflict: 'id' });
        if (error) throw error;
    } catch (error) {
        if (attempt <= maxAttempts) {
            const delay = attempt * 1000;
            console.warn(`⚠️ Upsert failed (Attempt ${attempt}/${maxAttempts}). Retrying in ${delay}ms...`, error);
            await new Promise(r => setTimeout(r, delay));
            return upsertWithRetry(supabase, table, data, attempt + 1, maxAttempts);
        }
        throw error;
    }
}

async function fetchAndDeleteMessages(
  accessToken: string,
  syncDeletedToken: string,
  dbAccountId: number,
  supabase: any
) {
  let pageToken: string | undefined = undefined;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams();
    if (pageToken) {
        params.append('pageToken', pageToken);
    } else {
        params.append('deltaToken', syncDeletedToken);
    } 

    const response = await fetch(
      `https://api.aurinko.io/v1/email/sync/deleted?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) throw new Error('Failed to fetch deleted messages');

    const data = await response.json();
    const deletedMessages: AurinkoDeletedMessage[] = data.records;

    if (deletedMessages.length > 0) {
      console.log(`🗑️ Deleting ${deletedMessages.length} messages...`);
      
      const idsToDelete = deletedMessages.map(d => d.id);
      
      const { error } = await supabase
        .from('emails')
        .delete()
        .in('id', idsToDelete)
        .eq('account_id', dbAccountId); // Safety check

      if (error) console.error('Supabase delete error:', error);
    }

    if (data.nextPageToken) {
      pageToken = data.nextPageToken;
    } else {
      hasMore = false;
    }
  }
}
