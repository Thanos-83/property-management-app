'use client';

import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BookingDetailsSheet } from './BookingDetailsSheet';
import { TableBooking } from '@/types/bookingTypes';

interface BookingActionsCellProps {
  booking: TableBooking;
}

export function BookingActionsCell({ booking }: BookingActionsCellProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Open menu</span>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={(e) => {
            setTimeout(() => setIsSheetOpen(true), 0);
          }}>
            <Pencil className='mr-2 h-4 w-4' />
            Edit
          </DropdownMenuItem>
          {/* Add delete or other actions here later */}
        </DropdownMenuContent>
      </DropdownMenu>

      <BookingDetailsSheet
        booking={booking}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </>
  );
}
