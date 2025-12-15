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
    let syncResponse = await startSync(accessToken, 30);
    

console.log(' 🔄 Sync Response', syncResponse);

    // 2. Poll until ready
    let attempts = 0;
    while (!syncResponse.ready && attempts < 10) {
      console.log(`⏳ Sync not ready, waiting... (Attempt ${attempts + 1})`);
      await new Promise(r => setTimeout(r, 1000)); // Wait 1s
      syncResponse = await startSync(accessToken, 30); // Re-check status
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
  let nextPageToken = syncUpdatedToken;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `https://api.aurinko.io/v1/email/sync/updated?deltaToken=${nextPageToken}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) throw new Error('Failed to fetch updated messages');

    const data = await response.json();
    const messages: AurinkoMessage[] = data.records;

    if (messages.length > 0) {
      console.log(`📥 Upserting ${messages.length} messages...`);
      
      const { error } = await supabase.from('emails').upsert(
        messages.map((msg) => ({
          id: msg.id,
          account_id: dbAccountId,
          thread_id: msg.threadId,
          subject: msg.subject || '(No Subject)',
          from_json: msg.from || { name: 'Unknown', address: 'unknown' },
          snippet: msg.bodySnippet || '',
          received_at: msg.receivedAt,
          // Simple folder mapping for now - logic can be enhanced if needed
          folder: msg.sysLabels?.includes('trash') ? 'trash' : 
                  msg.sysLabels?.includes('sent') ? 'sent' : 
                  'inbox', 
          is_read: !msg.sysLabels?.includes('unread'),
          updated_at: new Date().toISOString(),
        })),
        { onConflict: 'id' }
      );

      if (error) console.error('Supabase upsert error:', error);
    }

    if (data.nextPageToken) {
      nextPageToken = data.nextPageToken; // Continue pagination if available
    } else {
      hasMore = false; // No more pages in this delta
    }
  }
}

async function fetchAndDeleteMessages(
  accessToken: string,
  syncDeletedToken: string,
  dbAccountId: number,
  supabase: any
) {
  let nextPageToken = syncDeletedToken;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `https://api.aurinko.io/v1/email/sync/deleted?deltaToken=${nextPageToken}`,
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
      nextPageToken = data.nextPageToken;
    } else {
      hasMore = false;
    }
  }
}
