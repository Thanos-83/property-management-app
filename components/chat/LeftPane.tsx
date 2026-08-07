'use client';

import { useQueryState } from 'nuqs';
import { User, Clock, Search, Home } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Conversation } from '@/types/chatTypes';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function LeftPane({
  initialConversations,
}: {
  initialConversations: Conversation[];
}) {
  const router = useRouter();
  const [bookingThread, setBookingThread] = useQueryState('thread');
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  useEffect(() => {
    const supabaseClient = createClient();

    const chanel = supabaseClient
      .channel('conversations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload) {
            router.refresh();
          }
        },
      )
      .subscribe();

    return () => {
      chanel.unsubscribe();
    };
  }, []);

  return (
    <div className='flex flex-col h-full bg-background'>
      {/* 1. STICKY HEADER & SEARCH */}
      <div className='p-4 bg-white shrink-0 space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-black text-foreground tracking-tight'>
            Inbox
          </h2>
          <Badge variant='secondary' className='text-[10px] font-bold'>
            {initialConversations.length}
          </Badge>
        </div>

        <div className='relative'>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            type='text'
            placeholder='Search messages...'
            className='w-full pl-9 bg-muted/20 border-border shadow-none h-9 text-sm focus-visible:ring-1'
          />
        </div>
      </div>

      <div className='h-[2px] bg-border/50  w-full mb-2' />
      {/* 2. SCROLLABLE CONVERSATION LIST */}
      <ScrollArea className='flex-1 overflow-y-auto custom-scrollbar bg-muted/10'>
        {conversations.length === 0 ? (
          <div className='p-8 text-center flex flex-col items-center justify-center h-full text-muted-foreground'>
            <Search className='w-8 h-8 mb-3 opacity-20' />
            <p className='text-sm font-medium'>No messages found.</p>
          </div>
        ) : (
          <div className='flex flex-col'>
            {conversations.map((conv: Conversation) => {
              const isActive = bookingThread === conv.bookingId;

              return (
                <button
                  key={conv.id}
                  onClick={() => setBookingThread(conv.bookingId ?? null)}
                  className={`w-full text-left p-4 transition-all flex items-start gap-3 relative outline-none ${
                    isActive
                      ? 'bg-white border-b border-border shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] z-10'
                      : 'bg-transparent border-b border-border/50 hover:bg-muted/30'
                  }`}>
                  {/* Active State Indicator Strip */}
                  {isActive && (
                    <div className='absolute left-0 top-0 bottom-0 w-1 bg-[#e85c41] rounded-r-md' />
                  )}

                  {/* Avatar */}
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                      isActive
                        ? 'bg-primary/10 border-primary/20 text-primary'
                        : 'bg-white border-border text-muted-foreground shadow-sm'
                    }`}>
                    <User size={18} />
                  </div>

                  {/* Conversation Details */}
                  <div className='flex-1 min-w-0'>
                    <div className='flex justify-between items-baseline mb-0.5'>
                      <h3
                        className={`text-sm truncate ${isActive ? 'font-bold text-foreground' : 'font-semibold text-foreground/80'}`}>
                        {conv.guestName}
                      </h3>
                      <span
                        className={`text-[10px] whitespace-nowrap ml-2 ${isActive ? 'text-foreground font-bold' : 'text-muted-foreground font-semibold'}`}>
                        {conv.lastMessageAt
                          ? formatDistanceToNow(new Date(conv.lastMessageAt), {
                              addSuffix: true,
                            })
                          : ''}
                      </span>
                    </div>

                    {/* Property & Platform Row */}
                    <div className='flex items-center gap-1.5 mb-1.5'>
                      <Home className='w-3 h-3 text-muted-foreground/70' />
                      <span className='text-[11px] font-medium text-muted-foreground truncate'>
                        {conv.propertyTitle}
                      </span>
                      {conv.status === 'pending_ai_extraction' && (
                        <span className='ml-auto px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[9px] font-bold flex items-center gap-1'>
                          <Clock size={10} /> Pending
                        </span>
                      )}
                    </div>

                    {/* Message Preview */}
                    <p
                      className={`text-xs leading-relaxed line-clamp-1 ${isActive ? 'text-foreground/90 font-medium' : 'text-muted-foreground'}`}>
                      {conv.latestMessage}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
