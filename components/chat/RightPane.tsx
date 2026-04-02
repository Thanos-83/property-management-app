'use client';

import { useEffect, useState } from 'react';
import { useQueryState } from 'nuqs';
import { getGuestBooking } from '@/lib/actions/communicationHubActions';
import BookingDetails from './BookingDetails';
import { Loader2 } from 'lucide-react';
import { Booking } from '@/types/chatTypes';

export default function RightPane() {
  const [activeThread] = useQueryState('thread');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadBooking() {
      if (!activeThread) return;
      setIsLoading(true);
      const response = await getGuestBooking(activeThread);
      if (response.success && response.data !== undefined) {
        setBooking(response.data as Booking | null);
      }
      setIsLoading(false);
    }
    loadBooking();
  }, [activeThread]);

  if (!activeThread) return null;
  return (
    <div className='h-full bg-muted/20'>
      {isLoading ? (
        <div className='p-6 text-sm text-muted-foreground h-full flex flex-col items-center justify-center gap-2'>
          <Loader2 className='h-6 w-6 animate-spin' />
          <p className='text-muted-foreground font-medium animate-pulse'>
            Loading booking details...
          </p>
        </div>
      ) : (
        <BookingDetails booking={booking} />
      )}
    </div>
  );
}
