'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MailTable } from './MailTable';
import { createClient } from '@/lib/utils/supabase/client';
import { EmailSummary } from '@/lib/actions/emailActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface MailListContainerProps {
  initialMails: Promise<{
    success: boolean;
    data?: EmailSummary[];
    error?: string;
  }>;
  accountId: string | undefined;
  folder: string;
}

export function MailListContainer({
  initialMails,
  accountId,
  folder,
}: MailListContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchValue = searchParams.get('search') || '';

  const initialMailsResult = React.use(initialMails);
  // Extract the actual array, defaulting to empty if failed
  const initialEmails =
    initialMailsResult.success && initialMailsResult.data
      ? initialMailsResult.data
      : [];

  const [mails, setMails] = React.useState<EmailSummary[]>(initialEmails);
  const [loading] = React.useState(false);

  // Sync state with props when server re-renders (navigation)
  React.useEffect(() => {
    // If we receive a new Promise, 'initialMailsResult' updates after suspense
    // We update local state to match the fresh data
    if (initialMailsResult.success && initialMailsResult.data) {
      setMails(initialMailsResult.data);
    } else {
      // add a toast
      toast.error('Failed to fetch emails');
    }
  }, [initialMailsResult]);

  // Realtime Subscription for LIST updates
  React.useEffect(() => {
    if (!accountId) return;

    let isMounted = true;
    let channel: ReturnType<ReturnType<typeof createClient>['channel']> | null =
      null;
    const supabase = createClient();

    // Small delay to let React Strict Mode cleanup complete before subscribing
    const timeoutId = setTimeout(() => {
      if (!isMounted) return;

      channel = supabase
        .channel(`emails-list-${accountId}-${folder}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'emails',
            filter: `account_id=eq.${accountId}`,
          },
          (payload: any) => {
            if (payload.new.folder === folder) {
              const newEmail: EmailSummary = {
                id: payload.new.id,
                threadId: payload.new.thread_id,
                subject: payload.new.subject || '(No subject)',
                from: payload.new.from_json || { name: 'Unknown', address: '' },
                receivedAt: payload.new.received_at,
                bodySnippet: payload.new.snippet || '',
                sysClassifications: [],
                sysLabels: payload.new.is_read ? ['seen'] : ['unread'],
              };
              setMails((prev) => [newEmail, ...prev]);
            }
          },
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'emails',
            filter: `account_id=eq.${accountId}`,
          },
          (payload: any) => {
            const newData = payload.new;

            // If the updated email belongs in the current folder
            if (newData.folder === folder) {
              setMails((prev) => {
                const exists = prev.some((m) => m.id === newData.id);
                if (exists) {
                  // Update existing
                  return prev.map((m) => {
                    if (m.id === newData.id) {
                      return {
                        ...m,
                        subject: newData.subject || m.subject,
                        bodySnippet: newData.snippet || m.bodySnippet,
                        sysLabels: newData.is_read ? ['seen'] : ['unread'],
                        from: newData.from_json || m.from,
                      };
                    }
                    return m;
                  });
                } else {
                  // Add new (it moved HERE from somewhere else)
                  const newEmail: EmailSummary = {
                    id: newData.id,
                    threadId: newData.thread_id,
                    subject: newData.subject || '(No subject)',
                    from: newData.from_json || { name: 'Unknown', address: '' },
                    receivedAt: newData.received_at,
                    bodySnippet: newData.snippet || '',
                    sysClassifications: [],
                    sysLabels: newData.is_read ? ['seen'] : ['unread'],
                  };
                  return [newEmail, ...prev];
                }
              });
            }
            // If it does NOT belong in the current folder (moved OUT)
            else {
              setMails((prev) => prev.filter((m) => m.id !== newData.id));
            }
          },
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'emails',
            // NO FILTER for DELETE because 'old' record might not have account_id with default replica identity
          },
          (payload: any) => {
            // If the deleted ID is in our list, remove it.
            // This is safe because IDs are unique.
            setMails((prev) => prev.filter((m) => m.id !== payload.old.id));
          },
        )
        .subscribe();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (channel) supabase.removeChannel(channel);
    };
  }, [accountId, folder]);

  // Client-side Search Logic
  const filteredMails = searchValue
    ? mails.filter(
        (m) =>
          m.subject.toLowerCase().includes(searchValue.toLowerCase()) ||
          m.from.name.toLowerCase().includes(searchValue.toLowerCase()) ||
          m.from.address.toLowerCase().includes(searchValue.toLowerCase()),
      )
    : mails;

  return (
    <div className='flex flex-col h-full'>
      <Tabs defaultValue='all' className='h-[95%]'>
        <div className='flex items-center px-4 py-2'>
          {/* <h1 className="text-xl font-bold capitalize">{folder}</h1> */}
          <TabsList className='ml-auto'>
            <TabsTrigger
              value='all'
              className='text-zinc-600 dark:text-zinc-200'>
              All mail
            </TabsTrigger>
            <TabsTrigger
              value='unread'
              className='text-zinc-600 dark:text-zinc-200'>
              Unread
            </TabsTrigger>
          </TabsList>
        </div>
        <Separator />
        {/* Search removed from here and moved to Shell Header */}
        <div className='flex-1 overflow-auto h-[calc(100vh-200px)]'>
          <TabsContent value='all' className='m-0 h-full'>
            <MailTable
              data={filteredMails}
              selectedMailId={null}
              onSelectMail={(id) => {
                // Navigate to detail view
                router.push(
                  `/dashboard/email/${id}?folder=${folder}&accountId=${accountId}&search=${searchValue}`,
                );
              }}
              loading={loading}
              accountId={accountId || ''}
            />
          </TabsContent>
          <TabsContent value='unread' className='m-0 h-full'>
            <MailTable
              data={filteredMails.filter((m) => !m.sysLabels?.includes('seen'))}
              selectedMailId={null}
              onSelectMail={(id) => {
                router.push(
                  `/dashboard/email/${id}?folder=${folder}&accountId=${accountId}&search=${searchValue}`,
                );
              }}
              loading={loading}
              accountId={accountId || ''}
            />
          </TabsContent>
        </div>
      </Tabs>
      {/* End of Tabs */}
    </div>
  );
}
