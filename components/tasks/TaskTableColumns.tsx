'use client';

import { ColumnDef, FilterFn } from '@tanstack/react-table';
import { TableTask, TaskStatusOption } from '@/types/taskTypes';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { capitalizeFirstLetter } from '@/lib/heplers';
import moment from 'moment';
import UpdateTaskStatus from './UpdateTaskStatus';
import { cn } from '@/lib/utils';
import { CheckSquare, Flag, ChevronRight } from 'lucide-react';

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
    cell: ({ row }) => (
      <div className='font-medium'>
        {capitalizeFirstLetter(row.getValue('type'))}
      </div>
    ),
  },
  {
    header: 'Priority',
    accessorKey: 'priority',
    accessorFn: (row) => row.priority?.priority || 'Normal',
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
    accessorFn: (row) =>
      row.team_members
        ? `${row.team_members.first_name} ${row.team_members.last_name}`
        : 'Unassigned',
    cell: ({ row }) => {
      const name = row.getValue('team_members') as string;
      return (
        <span
          className={name === 'Unassigned' ? 'text-warning font-semibold' : ''}>
          {name}
        </span>
      );
    },
  },
  {
    header: 'Property Title',
    accessorKey: 'property',
    accessorFn: (row) => row.property?.title || 'Unknown Property',
    filterFn: multiSelectFilterFn,
    cell: ({ row }) => (
      <div className='truncate max-w-[200px]'>{row.getValue('property')}</div>
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
    cell: ({ row }) => (
      <div className='whitespace-nowrap'>
        {moment(row.getValue('scheduled_date')).format('DD-MM-YYYY')}
      </div>
    ),
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
