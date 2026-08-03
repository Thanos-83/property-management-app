'use client';

import { useState } from 'react';
import { MoreHorizontal, Pencil } from 'lucide-react';
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
import { TaskPriority, TaskStatusOption } from '@/types/taskTypes';
import { Property } from '@/types/propertyTypes';

interface BookingActionsCellProps {
  booking: TableBooking;
  properties: Property[];
  members: { id: string; name: string }[];
  priorities: TaskPriority[];
  taskStatus: TaskStatusOption[];
  currentUserId: string;
}

export function BookingActionsCell({
  booking,
  properties,
  members,
  priorities,
  taskStatus,
  currentUserId,
}: BookingActionsCellProps) {
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
          <DropdownMenuItem
            onSelect={() => {
              setTimeout(() => setIsSheetOpen(true), 0);
            }}>
            <Pencil className='mr-2 h-4 w-4' />
            Edit
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <BookingDetailsSheet
        booking={booking}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        properties={properties}
        members={members}
        priorities={priorities}
        taskStatus={taskStatus}
        currentUserId={currentUserId}
      />
    </>
  );
}
