'use client';

import { ColumnDef, FilterFn } from '@tanstack/react-table';
import { TableTask, TaskStatusOption } from '@/types/taskTypes';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { capitalizeFirstLetter } from '@/lib/heplers';
import {
  format,
  isToday,
  isTomorrow,
  isYesterday,
  isBefore,
  startOfToday,
} from 'date-fns';
import { el } from 'date-fns/locale';
import UpdateTaskStatus from './UpdateTaskStatus';
import { cn } from '@/lib/utils';
import { CheckSquare, Flag, ChevronRight, User, Building2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

// Custom filter function for status
export const multiSelectFilterFn: FilterFn<TableTask> = (
  row,
  columnId,
  filterValue: string[],
) => {
  if (!filterValue?.length) return true;
  const value = row.getValue(columnId) as string;
  return filterValue.includes(value);
};

export const getColumns: (
  taskStatuses: TaskStatusOption[],
) => ColumnDef<TableTask>[] = (taskStatuses) => [
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
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='Select row'
        />
      </div>
    ),
    size: 28,
    enableSorting: false,
  },
  {
    header: 'Task Type',
    accessorKey: 'type',
    cell: ({ row }) => {
      const isLinkedToBooking = !!row.original.booking_id;
      return (
        <div className='flex flex-col items-start gap-1.5 py-1'>
          {/* Make the main task type pop out a bit more */}
          <span className='font-semibold text-foreground'>
            {row.original.type}
          </span>

          {/* Context Badges */}
          {isLinkedToBooking ? (
            <Badge
              variant='outline'
              className='bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0 h-4 rounded-sm flex items-center gap-1 font-medium'>
              <User className='w-2.5 h-2.5' />
              Booking Task
            </Badge>
          ) : (
            <Badge
              variant='outline'
              className='bg-slate-50 text-slate-600 border-slate-200 text-[10px] px-1.5 py-0 h-4 rounded-sm flex items-center gap-1 font-medium'>
              <Building2 className='w-2.5 h-2.5' />
              Property Task
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    header: 'Priority',
    accessorKey: 'priority',
    accessorFn: (row) => row.priority?.priority || 'Normal',
    size: 100,
    maxSize: 120,
    minSize: 80,
    cell: ({ row }) => {
      const priority = row.getValue('priority') as string;
      return (
        <div className='flex items-center gap-1.5 text-xs font-medium'>
          <Flag
            className={cn(
              'w-3.5 h-3.5',
              priority?.toLowerCase() === 'high'
                ? 'text-destructive'
                : priority?.toLowerCase() === 'low'
                  ? 'text-muted-foreground'
                  : 'text-warning',
            )}
          />
          {capitalizeFirstLetter(priority)}
        </div>
      );
    },
  },
  {
    header: 'Assignee Name',
    accessorKey: 'team_members',
    cell: ({ row }) => {
      const teamMember = row.original.team_members;
      const assigneeName = teamMember
        ? teamMember?.first_name + ' ' + teamMember?.last_name
        : 'Unassigned';

      const avatarUrl = teamMember?.avatar_url;
      const isUnassigned =
        !assigneeName || assigneeName.toLowerCase() === 'unassigned';

      const getInitials = (name: string) => {
        if (!name) return '?';
        return name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
      };

      // --- STATE 1: UNASSIGNED ---
      if (isUnassigned) {
        return (
          <div className='flex items-center gap-2.5'>
            <div className='flex items-center justify-center w-7 h-7 rounded-full bg-warning/10 border border-warning/20 shrink-0'>
              <User className='w-3.5 h-3.5 text-warning' />
            </div>
            <span className='font-semibold text-warning'>Unassigned</span>
          </div>
        );
      }

      // --- STATE 2: ASSIGNED ---
      return (
        <div className='flex items-center gap-2.5'>
          <Avatar className='w-7 h-7 border border-border shadow-sm'>
            {/* If you store avatar URLs in the database, uncomment this: */}
            {avatarUrl && (
              <AvatarImage
                className='object-cover'
                src={avatarUrl}
                alt={assigneeName}
              />
            )}
            <AvatarFallback className='bg-primary/10 text-primary text-[10px] font-bold'>
              {getInitials(assigneeName)}
            </AvatarFallback>
          </Avatar>
          <span className='font-medium text-foreground'>{assigneeName}</span>
        </div>
      );
    },
  },
  {
    header: 'Property Title',
    accessorKey: 'property',
    accessorFn: (row) => row.property?.title || 'Unknown Property',
    filterFn: multiSelectFilterFn,
    size: 200,
    maxSize: 300,
    minSize: 180,
    cell: ({ row }) => (
      <div className='truncate'>{row.getValue('property')}</div>
    ),
  },

  {
    header: 'Status',
    accessorKey: 'status',
    filterFn: multiSelectFilterFn,
    cell: ({ row }) => {
      // Find the dynamic color for the current row's status
      const currentStatusObj = taskStatuses.find(
        (s) =>
          s.status.toLowerCase().trim() ===
          (row.getValue('status') as string).toLowerCase().trim(),
      );
      const dotColor = currentStatusObj?.status_color || '#ccc';

      return (
        <div
          className='flex items-center gap-1'
          onClick={(e) => e.stopPropagation()}>
          <Badge
            variant='outline'
            className='border-none gap-2 text-md font-normal items-baseline'>
            {/* Dynamic Status Dot in the Table */}
            <span
              className='size-1.5 rounded-full'
              style={{ backgroundColor: dotColor }}
              aria-hidden='true'></span>
            {capitalizeFirstLetter(
              (row.getValue('status') as string).replace('_', ' '),
            )}
          </Badge>

          {/* Pass the dynamic statuses down to the Dialog */}
          <UpdateTaskStatus
            taskId={row.original.id}
            taskStatus={row.original.status}
            taskStatuses={taskStatuses}
          />
        </div>
      );
    },
  },
  {
    header: 'Checklist',
    id: 'checklist',
    cell: ({ row }) => {
      const todos = row.original.task_list_item || [];
      if (todos.length === 0)
        return <span className='text-muted-foreground text-xs'>--</span>;
      const completed = todos.filter(
        (t: { id: string; is_completed: boolean }) => t.is_completed,
      ).length;
      return (
        <div
          className={`flex items-center gap-1.5 text-xs font-medium ${
            completed === todos.length
              ? 'text-green-400'
              : 'text-muted-foreground'
          }`}>
          <CheckSquare className='w-3.5 h-3.5' />
          {completed}/{todos.length}
        </div>
      );
    },
  },
  {
    header: 'Scheduled Date',
    accessorKey: 'scheduled_date',
    cell: ({ row }) => {
      const rawDate = row.original.scheduled_date;
      if (!rawDate) return <span className='text-muted-foreground'>-</span>;

      const dateObj = new Date(rawDate);

      // Default standard format
      let displayDate = format(dateObj, 'd MMMM yyyy', { locale: el });
      let textStyle = 'text-foreground font-medium'; // Default style

      // Smart Relative Logic & Color Coding
      if (isToday(dateObj)) {
        displayDate = 'Σήμερα';
        textStyle = 'text-red-600 font-bold'; // Urgent
      } else if (isTomorrow(dateObj)) {
        displayDate = 'Αύριο';
        textStyle = 'text-red-600 font-bold'; // Urgent
      } else if (isYesterday(dateObj)) {
        displayDate = 'Χθές';
        textStyle = 'text-red-800 font-semibold'; // Overdue
      } else if (isBefore(dateObj, startOfToday())) {
        // Any other date in the past
        textStyle = 'text-red-800 font-semibold'; // Overdue
      }

      return <span className={textStyle}>{displayDate}</span>;
    },
  },
  // --- NEW: Chevron Column ---
  {
    id: 'actions',
    cell: () => (
      <div className='flex justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
        <ChevronRight className='w-5 h-5 text-muted-foreground' />
      </div>
    ),
    size: 40,
  },
];
