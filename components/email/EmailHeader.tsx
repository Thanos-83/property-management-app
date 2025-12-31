'use client';

import * as React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  RefreshCw,
  Search,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { syncRecentEmails, syncEmailAccount } from '@/lib/actions/emailActions';
import { toast } from 'sonner';
import { SimulationMenu } from './SimulationMenu';
import { ComposeEmailDialog } from './ComposeEmailDialog';

export function EmailHeader({ accountId, emailAddress }: { accountId?: string, emailAddress?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // State
  const [loading, setLoading] = React.useState(false);
  const [composeOpen, setComposeOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const handleManualEmailsSync = () => {
    if (!accountId) return;
    
    startTransition(async () => {
        try {
            const result = await syncEmailAccount(accountId);
            if (result.success) {
                toast.success('Sync complete');
            } else {
                toast.error(result.error || 'Sync failed');
            }
        } catch (err) {
            toast.error('Something went wrong');
        }
    });
  };
  
  // Helper to update URL params
  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-b-border bg-background h-[60px]">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search emails..." 
                className="pl-8 w-[300px]" 
                defaultValue={searchParams.get('search') || ''}
                onChange={(e) => {
                    const value = e.target.value;
                    // Debounce URL update
                    const timeoutId = setTimeout(() => {
                        updateParams({ search: value });
                    }, 300);
                    return () => clearTimeout(timeoutId);
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              disabled={isPending || !accountId}
              onClick={() => handleManualEmailsSync()}
            >
              <div className={isPending ? 'animate-spin' : ''}>
                <RefreshCw className="h-4 w-4" />
              </div>
              <span className="sr-only">Sync</span>
            </Button>
            <Separator orientation="vertical" className="mx-1 h-6" />
            <Button
              variant="outline"
              size="sm"
              disabled={loading || !accountId}
              onClick={async () => {
                if (!accountId) return;
                setLoading(true);
                toast.promise(syncRecentEmails(accountId), {
                  loading: 'Scanning...',
                  success: (data) => {
                     setLoading(false);
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
                accountId={accountId || ''} 
                emailAddress={emailAddress || ''} 
            />
            <Button
              onClick={() => setComposeOpen(true)}
              size="sm"
              className="gap-2"
              disabled={!accountId}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
              New Email
            </Button>
            
            <ComposeEmailDialog 
                open={composeOpen} 
                onOpenChange={setComposeOpen} 
                accountId={accountId || ''} 
            />
          </div>
        </div>
  );
}
