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
  properties: { id: string; title: string }[];
}

export function BookingActionsCell({ booking, properties }: BookingActionsCellProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  console.log('Booking in actions cell: ', booking);
  console.log('Properties in actions cell: ', properties);
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
        properties={properties}
      />
    </>
  );
}
