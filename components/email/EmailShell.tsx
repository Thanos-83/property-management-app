'use client';

import * as React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Archive,
  ArchiveX,
  Inbox,
  Send,
  Trash2,
  RefreshCw,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AccountSwitcher } from './AccountSwitcher';
import { Nav } from './Nav';
import { syncRecentEmails, syncEmailAccount } from '@/lib/actions/emailActions';
import { toast } from 'sonner';
import { createClient } from '@/lib/utils/supabase/client';
import { SimulationMenu } from './SimulationMenu';
import { useActionState } from 'react';
import { ComposeEmailDialog } from './ComposeEmailDialog';

interface EmailShellProps {
  accounts: {
    id: string;
    email: string;
    icon: React.ReactNode;
  }[];
  initialFolderCounts?: Record<string, number>; // New prop
  defaultLayout: number[] | undefined;
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
  children: React.ReactNode;
}

export function EmailShell({
  accounts,
  initialFolderCounts,
  defaultLayout = [20, 80],
  defaultCollapsed = false,
  navCollapsedSize,
  children,
}: EmailShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // State
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const [loading, setLoading] = React.useState(false);
  const [composeOpen, setComposeOpen] = React.useState(false);
  
  // URL Params State
  const selectedAccount = searchParams.get('accountId') || accounts[0]?.id;
  const selectedFolder = searchParams.get('folder') || 'inbox';

  const [folderCounts, setFolderCounts] = React.useState<Record<string, number>>(initialFolderCounts || {
    inbox: 0,
    sent: 0,
    junk: 0,
    trash: 0,
    archive: 0,
  });

  const [syncState, syncAction, syncPending] = useActionState(syncEmailAccount, null);

  // Helper to update URL params
  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  // Fetch folder counts for the selected account
  const fetchFolderCounts = async () => {
    if (!selectedAccount) return;
    
    const supabase = createClient();
    const folders = ['inbox', 'sent', 'junk', 'trash', 'archive'];
    const counts: Record<string, number> = {};
    
    for (const folder of folders) {
      const { count } = await supabase
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

  // Supabase Realtime subscription for COUNTS
  React.useEffect(() => {
    if (!selectedAccount) return;

    let isMounted = true;
    let channel: ReturnType<ReturnType<typeof createClient>['channel']> | null = null;
    const supabase = createClient();

    // Small delay for Strict Mode
    const timeoutId = setTimeout(() => {
      if (!isMounted) return;

      channel = supabase 
        .channel(`emails-shell-${selectedAccount}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT', 
            schema: 'public',
            table: 'emails',
            filter: `account_id=eq.${selectedAccount}`,
          },
          (payload) => {
             console.log('🔔 Email INSERT detected in Shell');
             // Optimistic Update for Insert
             if (payload.new.folder) {
                 setFolderCounts(prev => ({
                     ...prev,
                     [payload.new.folder]: (prev[payload.new.folder] || 0) + 1
                 }));
             } 
             fetchFolderCounts();
          }
        )
        .on(
            'postgres_changes',
            {
              event: 'UPDATE', 
              schema: 'public',
              table: 'emails',
              filter: `account_id=eq.${selectedAccount}`,
            },
            (payload) => {
               console.log('🔔 Email UPDATE detected in Shell');
               fetchFolderCounts();
            }
        )
        .on(
            'postgres_changes',
            {
              event: 'DELETE', 
              schema: 'public',
              table: 'emails',
              // NO FILTER for DELETE
            },
            (payload) => {
               console.log('🔔 Email DELETE detected in Shell');
               // We don't know if it belongs to this account, but fetching is safe.
               fetchFolderCounts();
            }
        )
        .subscribe();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (channel) supabase.removeChannel(channel);
    };
  }, [selectedAccount]);

  // Sync Action Effect
  React.useEffect(() => {
    if (!syncState) return;
    if (syncState.success) toast.success('Sync complete');
    else if (syncState.error) toast.error(syncState.error || 'Sync failed');
  }, [syncState]);

  const handleManualEmailsSync = async () => {
    React.startTransition(() => syncAction(selectedAccount));
  };
  
  const selectedAccountData = accounts.find(a => a.id === selectedAccount);
  const selectedEmailAddress = selectedAccountData?.email || '';

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b bg-background">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">Email Manager</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              disabled={syncPending}
              onClick={() => handleManualEmailsSync()}
            >
              <div className={syncPending ? 'animate-spin' : ''}>
                <RefreshCw className="h-4 w-4" />
              </div>
              <span className="sr-only">Sync</span>
            </Button>
            <Separator orientation="vertical" className="mx-1 h-6" />
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={async () => {
                if (!selectedAccount) return;
                setLoading(true);
                toast.promise(syncRecentEmails(selectedAccount), {
                  loading: 'Scanning...',
                  success: (data) => {
                     setLoading(false);
                     fetchFolderCounts();
                     return `Processed ${data.count} emails.`;
                  },
                  error: 'Analysis failed.'
                });
              }}
              className="gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              Scan
            </Button>
            <SimulationMenu 
                accountId={selectedAccount} 
                emailAddress={selectedEmailAddress} 
            />
            <Button
              onClick={() => setComposeOpen(true)}
              size="sm"
              className="gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
              New Email
            </Button>
          </div>
        </div>
        
        <ResizablePanelGroup
          direction="horizontal"
          onLayout={(sizes: number[]) => {
            document.cookie = `react-resizable-panels:layout=${JSON.stringify(sizes)}`;
          }}
          className="items-stretch h-full"
        >
          <ResizablePanel
            defaultSize={defaultLayout[0]}
            collapsedSize={navCollapsedSize}
            collapsible={true}
            minSize={15}
            maxSize={20}
            onCollapse={() => {
              setIsCollapsed(true);
              document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(true)}`;
            }}
            onExpand={() => {
              setIsCollapsed(false);
              document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(false)}`;
            }}
            className={cn(
              isCollapsed && 'min-w-[50px] transition-all duration-300 ease-in-out',
              'flex flex-col'
            )}
          >
            <div className={cn('flex h-[52px] items-center justify-center', isCollapsed ? 'h-[52px]' : 'px-2')}>
              <AccountSwitcher
                isCollapsed={isCollapsed}
                accounts={accounts}
                selectedAccount={selectedAccount}
                onAccountChange={(id) => updateParams({ accountId: id })}
              />
            </div>
            <Separator />
            <Nav
              isCollapsed={isCollapsed}
              selectedFolder={selectedFolder}
              onSelectFolder={(folder) => {
                  updateParams({ folder });
                  // Also verify we are on the main page, if on detail page we might want to go back?
                  // Yes, Nav click should probably go to /dashboard/email?folder=X
                  router.push(`/dashboard/email?folder=${folder}&accountId=${selectedAccount}`);
              }}
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
          <ResizablePanel defaultSize={defaultLayout[1]}>
             {children}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <ComposeEmailDialog 
        open={composeOpen} 
        onOpenChange={setComposeOpen} 
        accountId={selectedAccount} 
      />
    </TooltipProvider>
  );
}
