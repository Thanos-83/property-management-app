'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { MailList } from './MailList';
import { createClient } from '@/lib/utils/supabase/client';
import { EmailSummary } from '@/lib/actions/emailActions';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

interface MailListContainerProps {
  initialMails: EmailSummary[];
  accountId: string;
  folder: string;
}

export function MailListContainer({
  initialMails,
  accountId,
  folder,
}: MailListContainerProps) {
  const router = useRouter();
  const [mails, setMails] = React.useState<EmailSummary[]>(initialMails);
  const [loading, setLoading] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');
  
  // Sync state with props when server re-renders (navigation)
  React.useEffect(() => {
    setMails(initialMails);
    setSearchValue(''); // Reset search on folder change? Maybe better UX to keep it?
    // Let's reset for now as typical behavior
  }, [initialMails, folder]);

  // Realtime Subscription for LIST updates
  React.useEffect(() => {
    if (!accountId) return;

    let isMounted = true;
    let channel: ReturnType<ReturnType<typeof createClient>['channel']> | null = null;
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
                  setMails(prev => [newEmail, ...prev]);
               }
          }
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
                    setMails(prev => {
                        const exists = prev.some(m => m.id === newData.id);
                        if (exists) {
                            // Update existing
                            return prev.map(m => {
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
                    setMails(prev => prev.filter(m => m.id !== newData.id));
                }
            }
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
                setMails(prev => prev.filter(m => m.id !== payload.old.id));
            }
        )
        .subscribe();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (channel) supabase.removeChannel(channel);
    };
  }, [accountId, folder]);

  // Client-side Search Logic (Simple filtering for now, or could trigger server params)
  // For better UX with large lists, we should probably stick to client-side filtering if list is small,
  // OR push search param to URL.
  // Given the complexity, let's keep basic client filter for instant feedback on fetched list.
  const filteredMails = searchValue 
    ? mails.filter(m => 
        m.subject.toLowerCase().includes(searchValue.toLowerCase()) || 
        m.from.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        m.from.address.toLowerCase().includes(searchValue.toLowerCase())
      )
    : mails;

  return (
    <div className="flex flex-col h-full">
         <Tabs defaultValue="all">
            <div className="flex items-center px-4 py-2">
              <h1 className="text-xl font-bold capitalize">{folder}</h1>
              <TabsList className="ml-auto">
                <TabsTrigger value="all" className="text-zinc-600 dark:text-zinc-200">
                  All mail
                </TabsTrigger>
                <TabsTrigger value="unread" className="text-zinc-600 dark:text-zinc-200">
                  Unread
                </TabsTrigger>
              </TabsList>
            </div>
            <Separator />
            <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search" 
                    className="pl-8" 
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                  />
                </div>
              </form>
            </div>
            <TabsContent value="all" className="m-0">
              <MailList 
                items={filteredMails} 
                selectedMailId={null} // List view doesn't highlight selected
                onSelectMail={(id) => {
                    // Navigate to detail view
                    router.push(`/dashboard/email/${id}?folder=${folder}&accountId=${accountId}`);
                }}
                loading={loading}
              />
            </TabsContent>
            <TabsContent value="unread" className="m-0">
              <MailList 
                items={filteredMails.filter(m => !m.sysLabels?.includes('seen'))} 
                selectedMailId={null}
                onSelectMail={(id) => {
                    router.push(`/dashboard/email/${id}?folder=${folder}&accountId=${accountId}`);
                }}
                loading={loading}
              />
            </TabsContent>
          </Tabs>
    </div>
  );
}
