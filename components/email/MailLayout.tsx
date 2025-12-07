'use client';

import * as React from 'react';
import {
  AlertCircle,
  Archive,
  ArchiveX,
  File,
  Inbox,
  MessagesSquare,
  Search,
  Send,
  ShoppingCart,
  Trash2,
  Users2,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Separator } from '@/components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AccountSwitcher } from './AccountSwitcher';
import { MailDisplay } from './MailDisplay';
import { MailList } from './MailList';
import { Nav } from './Nav';
import type { EmailSummary } from '@/lib/actions/emailActions';
import { getEmailsFromDB } from '@/lib/actions/emailActions';
import { toast } from 'sonner';
import { createClient } from '@/lib/utils/supabase/client';
import { SidebarTrigger } from '../ui/sidebar';


interface MailLayoutProps {
  accounts: {
    id: string;
    email: string;
    icon: React.ReactNode;
  }[];
  defaultLayout: number[] | undefined;
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
  initialMails?: EmailSummary[];
}



// ... imports ...

export function MailLayout({
  accounts,
  defaultLayout = [265, 440, 655],
  defaultCollapsed = false,
  navCollapsedSize,
  initialMails = [],
}: MailLayoutProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const [selectedAccount, setSelectedAccount] = React.useState(accounts[0]?.id);
  const [selectedFolder, setSelectedFolder] = React.useState('inbox');
  const [mails, setMails] = React.useState<EmailSummary[]>(initialMails);
  const [selectedMailId, setSelectedMailId] = React.useState<string | null>(null);
  
  const [loading, setLoading] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');
  const [folderCounts, setFolderCounts] = React.useState<Record<string, number>>({
    inbox: 0,
    sent: 0,
    junk: 0,
    trash: 0,
    archive: 0,
  });
  
console.log('mails: ',mails);




  // Handle folder changes by fetching from DB using CLIENT-SIDE Supabase
  const handleFolderChange = async (folder: string) => {
  
    setSelectedFolder(folder);
    setLoading(true);
    
    try {
      // Use client-side Supabase (not server action) for client-triggered queries
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .eq('account_id', selectedAccount)
        .eq('folder', folder)
        .order('received_at', { ascending: false });
      
      if (error) {
        console.error('DB fetch error:', error);
        toast.error('Failed to load emails');
        return;
      }
      
      // Transform to EmailSummary format
      const emails: EmailSummary[] = (data || []).map((record) => ({
        id: record.id,
        threadId: record.thread_id,
        subject: record.subject,
        from: record.from_json,
        receivedAt: record.received_at,
        bodySnippet: record.snippet,
        sysClassifications: [],
        sysLabels: record.is_read ? ['seen'] : ['unread'],
      }));
      
      setMails(emails);
      
      // Refresh folder counts
      fetchFolderCounts();
    } catch (error) {
      console.error('Error fetching emails:', error);
      toast.error('Failed to load emails');
    } finally {
      setLoading(false);
    }
  };

  // Fetch folder counts for the selected account
  const fetchFolderCounts = async () => {
    if (!selectedAccount) return;
    
    const supabase = createClient();
    const folders = ['inbox', 'sent', 'junk', 'trash', 'archive'];
    const counts: Record<string, number> = {};
    
    for (const folder of folders) {
      const { count, error } = await supabase
        .from('emails')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', selectedAccount)
        .eq('folder', folder);
      
      counts[folder] = count || 0;
    }
    
    setFolderCounts(counts);
  };

  // Fetch counts when account changes
  React.useEffect(() => {
    fetchFolderCounts();
  }, [selectedAccount]);

// Track current folder in a ref so the Realtime callback can access it
  // without triggering re-subscription when folder changes
  const selectedFolderRef = React.useRef(selectedFolder);
  React.useEffect(() => {
    selectedFolderRef.current = selectedFolder;
  }, [selectedFolder]);

  // Supabase Realtime subscription - subscribe ONCE per account
  React.useEffect(() => {
    if (!selectedAccount) return;

    // Track if component is still mounted (handles React Strict Mode double-mount)
    let isMounted = true;
    let channel: ReturnType<ReturnType<typeof createClient>['channel']> | null = null;

    console.log('🔌 Setting up Realtime subscription for account:', selectedAccount);

    const supabase = createClient();

    // Small delay to let React Strict Mode cleanup complete before subscribing
    const timeoutId = setTimeout(() => {
      if (!isMounted) return; // Component unmounted during delay

      channel = supabase 
        .channel(`emails-${selectedAccount}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'emails',
            filter: `account_id=eq.${selectedAccount}`,
          },
          (payload: any) => {
            if (!isMounted) return; // Ignore if unmounted
            
            const currentFolder = selectedFolderRef.current;
            console.log('🔥 INSERT EVENT:', payload.new.subject);
            
            if (payload.new.folder === currentFolder) {
              console.log('   ✅ Adding to UI (matches folder:', currentFolder, ')');
              
              // Transform database row to EmailSummary format
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
              
              setMails((prevMails) => [newEmail, ...prevMails]);
              
              // Update folder count
              setFolderCounts((prev) => ({
                ...prev,
                [payload.new.folder]: (prev[payload.new.folder] || 0) + 1,
              }));
            } else {
              console.log('   ⏭️ Ignoring (email folder:', payload.new.folder, ', viewing:', currentFolder, ')');
              
              // Still update count even if not in current folder view
              setFolderCounts((prev) => ({
                ...prev,
                [payload.new.folder]: (prev[payload.new.folder] || 0) + 1,
              }));
            }
          }
        ).on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'emails',
          filter: `account_id=eq.${selectedAccount}`,
        }, (payload: any) => {
          if (!isMounted) return; // Ignore if unmounted
          
          const currentFolder = selectedFolderRef.current;
          console.log('🔥 UPDATE DATA:', payload);
          console.log('   Old folder:', payload.old?.folder);
          console.log('   New folder:', payload.new.folder);
          
          if (payload.new.folder === currentFolder) {
            console.log('   ✅ Updating UI (matches folder:', currentFolder, ')');
            
            // Transform database row to EmailSummary format
            const updatedEmail: EmailSummary = {
              id: payload.new.id,
              threadId: payload.new.thread_id,
              subject: payload.new.subject || '(No subject)',
              from: payload.new.from_json || { name: 'Unknown', address: '' },
              receivedAt: payload.new.received_at,
              bodySnippet: payload.new.snippet || '',
              sysClassifications: [],
              sysLabels: payload.new.is_read ? ['seen'] : ['unread'],
            };
            
            setMails((prevMails) => {
              const updatedIndex = prevMails.findIndex((mail) => mail.id === payload.new.id);
              if (updatedIndex !== -1) {
                // Email already in list, update it
                const updatedMails = [...prevMails];
                updatedMails[updatedIndex] = updatedEmail;
                return updatedMails;
              } else {
                // Email moved TO this folder, add it
                return [updatedEmail, ...prevMails];
              }
            });
          } else {
            console.log('⏭️ Removing (email moved to:', payload.new.folder, ')');
            // Email moved OUT of current folder, remove it from list
            setMails((prevMails) => {
              const updatedIndex = prevMails.findIndex((mail) => mail.id === payload.new.id);
              if (updatedIndex !== -1) {
                const updatedMails = [...prevMails];
                updatedMails.splice(updatedIndex, 1);
                return updatedMails;
              }
              return prevMails;
            });
          }
          
          // Refetch counts on UPDATE
          if (selectedAccount) {
            const supabase = createClient();
            const folders = ['inbox', 'sent', 'junk', 'trash', 'archive'];
            Promise.all(
              folders.map(async (folder) => {
                const { count } = await supabase
                  .from('emails')
                  .select('*', { count: 'exact', head: true })
                  .eq('account_id', selectedAccount)
                  .eq('folder', folder);
                return { folder, count: count || 0 };
              })
            ).then((results) => {
              const counts: Record<string, number> = {};
              results.forEach(({ folder, count }) => {
                counts[folder] = count;
              });
              setFolderCounts(counts);
            });
          }
        })
        .subscribe((status) => {
          console.log('📡 Realtime status:', status);
        });
    }, 100); // 100ms delay handles Strict Mode

    // Cleanup
    return () => {
      console.log('🔌 Unsubscribing from Realtime');
      isMounted = false;
      clearTimeout(timeoutId);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [selectedAccount]);

  const selectedMail = mails.find((mail) => mail.id === selectedMailId);

  const handleSelectedMail = async (id: string) => {
    setSelectedMailId(id);
    const supabase = createClient();
    const { error } = await supabase.from('emails').update({ is_read: true }).eq('id', id);
    if (error) {
      console.error('Error updating email read status:', error);
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes: number[]) => {
          document.cookie = `react-resizable-panels:layout=${JSON.stringify(
            sizes
          )}`;
        }}
        className="items-stretch h-full"
      >
        {/* ... Panel 1 ... */}
        <ResizablePanel
          defaultSize={defaultLayout[0]}
          collapsedSize={navCollapsedSize}
          collapsible={true}
          minSize={15}
          maxSize={20}
          onCollapse={() => {
            setIsCollapsed(true);
            document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
              true
            )}`;
          }}
          onExpand={() => {
            setIsCollapsed(false);
            document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
              false
            )}`;
          }}
          className={cn(
            isCollapsed &&
              'min-w-[50px] transition-all duration-300 ease-in-out'
          )}
        >
          <div
            className={cn(
              'flex h-[52px] items-center justify-center',
              isCollapsed ? 'h-[52px]' : 'px-2'
            )}
          >
            <AccountSwitcher
              isCollapsed={isCollapsed}
              accounts={accounts}
              selectedAccount={selectedAccount}
              onAccountChange={setSelectedAccount}
            />
          </div>
          <Separator />
          <Nav
            isCollapsed={isCollapsed}
            selectedFolder={selectedFolder}
            onSelectFolder={(folder)=>handleFolderChange(folder)}
            links={[
              {
                title: 'Inbox',
                label: String(folderCounts.inbox || 0),
                icon: Inbox,
                variant: selectedFolder === 'inbox' ? 'default' : 'ghost',
                folder: 'inbox',
              },
              {
                title: 'Sent',
                label: String(folderCounts.sent || 0),
                icon: Send,
                variant: selectedFolder === 'sent' ? 'default' : 'ghost',
                folder: 'sent',
              },
              {
                title: 'Junk',
                label: String(folderCounts.junk || 0),
                icon: ArchiveX,
                variant: selectedFolder === 'junk' ? 'default' : 'ghost',
                folder: 'junk',
              },
              {
                title: 'Trash',
                label: String(folderCounts.trash || 0),
                icon: Trash2,
                variant: selectedFolder === 'trash' ? 'default' : 'ghost',
                folder: 'trash',
              },
              {
                title: 'Archive',
                label: String(folderCounts.archive || 0),
                icon: Archive,
                variant: selectedFolder === 'archive' ? 'default' : 'ghost',
                folder: 'archive',
              },
            ]}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
          <Tabs defaultValue="all">
            <div className="flex items-center px-4 py-2">
              <h1 className="text-xl font-bold">Inbox <SidebarTrigger/></h1>
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
                items={mails} 
                selectedMailId={selectedMailId}
                // onSelectMail={setSelectedMailId}
                onSelectMail={(id) => 
                  // console.log('Selected Mail ID:', id);
                  // setSelectedMailId(id);
                  handleSelectedMail(id)
                }
                loading={loading}
              />
            </TabsContent>
            <TabsContent value="unread" className="m-0">
              {/* Filter unread logic here */}
              <MailList 
                items={mails.filter(m => !m.sysLabels?.includes('seen'))} 
                selectedMailId={selectedMailId}
                onSelectMail={setSelectedMailId}
                loading={loading}
              />
            </TabsContent>
          </Tabs>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[2]}>
          <MailDisplay mail={selectedMail || null} accountId={selectedAccount} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  );
}
