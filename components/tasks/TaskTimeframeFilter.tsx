'use client';

import { useState, useTransition } from 'react';
import { useQueryState } from 'nuqs';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

export function TaskTimeframeFilter() {
  const [isPending, startTransition] = useTransition();
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  const [timeframe, setTimeframe] = useQueryState('timeframe', {
    defaultValue: 'upcoming',
    shallow: false,
  });

  const handleTimeframeChange = (value: string) => {
    // Optional: Prevent overlapping requests if a transition is already happening
    if (isPending) return;

    // 1. Record which tab was just clicked
    setPendingTab(value);

    // 2. Start the server request
    startTransition(() => {
      setTimeframe(value);
    });
  };

  return (
    <Tabs value={timeframe} onValueChange={handleTimeframeChange}>
      {/* Slightly increased the width to accommodate the spinner without text shifting */}
      <TabsList className='grid w-full grid-cols-3 md:w-[350px]'>
        <TabsTrigger
          value='upcoming'
          disabled={isPending && pendingTab === 'upcoming'}>
          <span className='flex items-center gap-4'>
            Upcoming
            {isPending && pendingTab === 'upcoming' && (
              <Loader2 className='w-3 h-3 animate-spin text-muted-foreground' />
            )}
          </span>
        </TabsTrigger>

        <TabsTrigger value='past' disabled={isPending && pendingTab === 'past'}>
          <span className='flex items-center gap-4'>
            Past
            {isPending && pendingTab === 'past' && (
              <Loader2 className='w-3 h-3 animate-spin text-muted-foreground' />
            )}
          </span>
        </TabsTrigger>

        <TabsTrigger value='all' disabled={isPending && pendingTab === 'all'}>
          <span className='flex items-center gap-4'>
            All
            {isPending && pendingTab === 'all' && (
              <Loader2 className='w-3 h-3 animate-spin text-muted-foreground' />
            )}
          </span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
