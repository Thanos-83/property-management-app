'use client';

import * as React from 'react';
import {useSearchParams} from 'next/navigation';
import { getFolderCounts } from '@/lib/actions/emailActions';
import { startTransition, useActionState } from 'react';
import { Skeleton } from '../ui/skeleton';
// import Link from 'next/link';
import {Inbox, Send, Archive, ArchiveX, Trash} from 'lucide-react';
import { capitalizeFirstLetter } from '@/lib/heplers';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';

import { createClient } from '@/lib/utils/supabase/client';

export function EmailsNav() {
    const [isLoading, setIsLoading] = React.useState(false);
    const searchParams = useSearchParams();
    const accountId = searchParams.get('accountId');
    const [folderState, foldersAction, isPending] = useActionState(getFolderCounts, null);
    const router = useRouter();

    React.useEffect(() => {
        if (accountId) {
            startTransition(() => foldersAction(accountId));
            setIsLoading(isPending);
        }else if (!accountId) {
            setIsLoading(isPending);
        }
    }, [accountId]); // Re-run if account changes

    // Realtime Subscription for FOLDER COUNTS
    React.useEffect(() => {
        if (!accountId) return;

        let channel: ReturnType<ReturnType<typeof createClient>['channel']> | null = null;
        let isMounted = true;
        const supabase = createClient();

        console.log('🔄 Setting up folder count subscription for:', accountId);

        // Small delay to handle React Strict Mode mounting/unmounting behavior
        const timeoutId = setTimeout(() => {
            if (!isMounted) return;

            // Subscribe to changes
            channel = supabase
                .channel(`emails-counts-${accountId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'emails',
                        filter: `account_id=eq.${accountId}`,
                    },
                    (payload) => {
                        console.log('🔔 INSERT event received:', payload);
                        startTransition(() => foldersAction(accountId));
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'DELETE',
                        schema: 'public',
                        table: 'emails',
                    },
                    (payload) => {
                        console.log('🔔 DELETE event received:', payload);
                        startTransition(() => foldersAction(accountId));
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
                    (payload) => {
                         console.log('🔔 UPDATE event received:', payload);
                         startTransition(() => foldersAction(accountId));
                    }
                )
                .subscribe((status, err) => {
                    console.log(`📡 Subscription status for ${accountId}:`, status);
                    if (err) {
                        console.error('❌ Subscription error:', err);
                    }
                });
        }, 100);

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
            if (channel) {
                console.log('🛑 Cleaning up subscription');
                supabase.removeChannel(channel);
            }
        };
    }, [accountId]);

    React.useLayoutEffect(() => {
        setIsLoading(isPending);
    }, [isPending]);

    // Use folderState if available, otherwise empty
    const counts = folderState || {};

    return (
        <div className="flex flex-col h-full"> 
            <ul className="flex flex-col space-y-2 px-2">
                <>
                    {isPending ? <div className="p-4 space-y-2"> {Array.from({length: 5}).map((_, index) => <Skeleton key={index} className="h-4 w-4 w-full" />)} </div>
                    : Object.entries(counts).map(([folder, count]) => (
                        <li key={folder}>
                            <Button variant="ghost" className={`flex items-center justify-between w-full rounded-md cursor-pointer text-sm font-medium p-2 ${folder === searchParams.get('folder') ? 'bg-foreground text-background hover:bg-foreground/80 hover:text-background' : 'bg-background text-foreground hover:bg-muted hover:text-foreground'}`} onClick={() => router.push(`/dashboard/email?folder=${folder}&accountId=${accountId}`)}>
                            <div className="flex items-center gap-4">
                                {folder === 'inbox' ? <Inbox className="w-4 h-4"/>
                                : folder === 'sent' ? <Send className="w-4 h-4"/>
                                : folder === 'archive' ? <Archive className="w-4 h-4"/>
                                : folder === 'junk' ? <ArchiveX className="w-4 h-4"/>
                                : folder === 'trash' ? <Trash className="w-4 h-4"/>
                                : <span className="font-bold">{capitalizeFirstLetter(folder)}</span>
                                 }
                                 <span className="font-semibold">{capitalizeFirstLetter(folder)}</span>
                            </div>

                            {isPending ? <span className='animate-pulse'><Skeleton className="h-4 w-4" /></span> : <span className="text-xs">{count}</span>}
                            </Button>
                        </li>
                    ))}
                </>
            </ul>
        </div>
    );
}