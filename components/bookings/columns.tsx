'use client';

import { ColumnDef } from '@tanstack/react-table';
import { TableBooking } from '@/types/bookingTypes';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import moment from 'moment';
import { CalendarIcon, HomeIcon, MailIcon, UserIcon } from 'lucide-react';

import Image from 'next/image';
import { HelpCircleIcon } from 'lucide-react';
import { BookingActionsCell } from './BookingActionsCell';
import { TaskStatusCell } from './TaskStatusCell';
import {
  DetailedTask,
  TaskPriority,
  TaskStatusOption,
} from '@/types/taskTypes';
import { Property } from '@/types/propertyTypes';

const getPlatformIcon = (platform: string) => {
  const p = platform.toLowerCase();
  if (p.includes('airbnb')) return '/icons/airbnb.svg';
  if (p.includes('booking')) return '/icons/booking.svg';
  if (p.includes('vrbo')) return '/icons/vrbo.svg';
  if (p.includes('expedia')) return '/icons/expedia.svg';
  if (p.includes('Unknown')) return '';
  return null;
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return 'bg-green-500';
    case 'pending':
      return 'bg-amber-500';
    case 'cancelled':
      return 'bg-red-500';
    case 'completed':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
};

const getRelativeStatus = (startDate: string, endDate: string) => {
  const now = moment().startOf('day');
  const start = moment(startDate).startOf('day');
  const end = moment(endDate).startOf('day');

  const diffStart = start.diff(now, 'days');
  const diffEnd = end.diff(now, 'days');

  if (diffEnd < 0) {
    return {
      label: 'Checked Out',
      variant: 'secondary' as const,
      className: 'text-muted-foreground bg-secondary/50',
    };
  }
  if (diffStart <= 0 && diffEnd >= 0) {
    if (diffStart === 0) {
      return {
        label: 'Arriving Today',
        variant: 'default' as const,
        className: 'bg-green-600 hover:bg-green-700',
      };
    }
    return {
      label: 'Checked In',
      variant: 'default' as const,
      className: 'bg-green-500 hover:bg-green-600',
    };
  }
  if (diffStart > 0) {
    if (diffStart === 1) {
      return {
        label: 'Tomorrow',
        variant: 'default' as const,
        className: 'bg-amber-500 hover:bg-amber-600',
      };
    }
    if (diffStart < 30) {
      return {
        label: `In ${diffStart} days`,
        variant: 'outline' as const,
        className: 'text-blue-600 border-blue-200 bg-blue-50',
      };
    }
    const months = Math.round(diffStart / 30);
    return {
      label: `In ${months} mo.`,
      variant: 'outline' as const,
      className: 'text-indigo-600 border-indigo-200 bg-indigo-50',
    };
  }
  return null;
};

export const columns: ColumnDef<TableBooking>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
      />
    ),
    size: 40,
    enableSorting: false,
  },
  {
    accessorKey: 'guest_name',
    header: 'Guest',
    cell: ({ row }) => {
      const guestName = row.original.guest_name || 'Unknown Guest';
      const guestEmail = row.original.guest_email;

      return (
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-2 font-medium'>
            <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary'>
              <UserIcon size={14} />
            </div>
            <div className='flex flex-col items-start gap-1'>
              {guestName}

              {guestEmail && (
                <div className='flex items-center gap-1'>
                  {' '}
                  <MailIcon
                    size={12}
                    className='text-muted-foreground mt-[2px] w-3 h-3'
                  />{' '}
                  <span
                    className='text-xs text-muted-foreground truncate max-w-[240px]'
                    title={guestEmail}>
                    {guestEmail}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'property',
    header: 'Property',
    cell: ({ row }) => {
      return (
        <div className='flex flex-col'>
          <div className='flex items-center gap-2 text-muted-foreground'>
            <HomeIcon size={14} />
            <span>{row.original.property?.title || 'Unknown Property'}</span>
          </div>
          {row.original.property?.location && (
            <span className='ml-6 text-xs text-muted-foreground'>
              {row.original.property.location}
            </span>
          )}
        </div>
      );
    },
    // Custom filter function for property title if needed,
    // but accessorKey 'property' might object.
    // accessorFn is better for sorting/filtering nested data.
    accessorFn: (row) => row.property?.title,
  },
  {
    accessorKey: 'platform',
    header: 'Platform',
    size: 60, // Smaller width for icons
    cell: ({ row }) => {
      const iconPath = getPlatformIcon(row.original.platform || 'Unknown');
      if (iconPath) {
        return (
          <div className='flex items-center justify-start h-8 w-24'>
            <Image
              src={iconPath}
              alt={row.original.platform || 'Unknown platform'}
              width={80}
              height={32}
              className='object-contain h-full w-auto'
            />
          </div>
        );
      }

      return (
        <Badge variant='outline' className='font-normal gap-1'>
          <HelpCircleIcon size={12} />
          {row.original.platform}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'dates', // Virtual column for dates
    header: 'Stay',
    sortingFn: (rowA, rowB) => {
      const dateA = new Date(rowA.original.start_date).getTime();
      const dateB = new Date(rowB.original.start_date).getTime();
      return dateA - dateB;
    },
    cell: ({ row }) => {
      const start = moment(row.original.start_date);
      const end = moment(row.original.end_date);
      const nights = end.diff(start, 'days');
      const relativeStatus = getRelativeStatus(
        row.original.start_date,
        row.original.end_date,
      );

      return (
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-1 font-medium'>
            <CalendarIcon size={14} className='opacity-70' />
            <span>{start.format('MMM D, YYYY')}</span>
            <span className='text-muted-foreground'>→</span>
            <span>{end.format('MMM D, YYYY')}</span>
          </div>
          <div className='flex items-center gap-2'>
            {relativeStatus && (
              <Badge
                variant={relativeStatus.variant}
                className={cn(
                  'w-fit text-[10px] h-5 px-2',
                  relativeStatus.className,
                )}>
                {relativeStatus.label}
              </Badge>
            )}
            <span className='text-xs text-muted-foreground'>
              {nights} Nights
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status || 'unknown';
      return (
        <Badge variant='outline' className='border-none gap-2 font-normal'>
          <span
            className={cn('size-2 rounded-full', getStatusColor(status))}
            aria-hidden='true'
          />
          <span className='capitalize'>{status}</span>
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'tasks',
    header: 'Tasks',
    cell: ({ row, table }) => {
      const meta = table.options.meta as {
        properties: Property[];
        members: { id: string; name: string }[];
        priorities: TaskPriority[];
        taskStatus: TaskStatusOption[];
        currentUserId: string;
      };
      // console.log('Table Metadata: ', meta);
      // console.log('Row Original: ', row.original);
      return (
        <TaskStatusCell
          tasks={(row.original as { tasks: DetailedTask[] })?.tasks || []}
          bookingId={row.original.id}
          bookingStatus={row.original.status}
          propertyId={row.original.property_id}
          guestName={row.original.guest_name || 'Unknown Guest'}
          propertyTitle={row.original.property?.title || 'Unknown Property'}
          properties={meta?.properties || []}
          members={meta?.members || []}
          priorities={meta?.priorities || []}
          taskStatus={meta?.taskStatus || []}
          currentUserId={meta?.currentUserId || ''}
        />
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const meta = table.options.meta as {
        properties: Property[];
        members: { id: string; name: string }[];
        priorities: TaskPriority[];
        taskStatus: TaskStatusOption[];
        currentUserId: string;
      };
      return (
        <BookingActionsCell
          booking={row.original}
          properties={meta?.properties || []}
          members={meta?.members || []}
          priorities={meta?.priorities || []}
          taskStatus={meta?.taskStatus || []}
          currentUserId={meta?.currentUserId || ''}
        />
      );
    },
    size: 40,
  },
];
