'use client';

import { useEffect, useState, useRef, useId, useMemo } from 'react';
import {
  ColumnDef,
  flexRender,
  // ColumnDef,
  // ColumnFiltersState,
  FilterFn,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  // getPaginationRowModel,
  getSortedRowModel,
  // PaginationState,
  // Row,
  // SortingState,
  useReactTable,
  Row,
  // VisibilityState,
} from '@tanstack/react-table';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  // DropdownMenuGroup,
  // DropdownMenuItem,
  DropdownMenuLabel,
  // DropdownMenuPortal,
  // DropdownMenuSeparator,
  // DropdownMenuShortcut,
  // DropdownMenuSub,
  // DropdownMenuSubContent,
  // DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { cn } from '@/lib/utils';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableTask } from '@/types/taskTypes';
// import { fetchTasksAction } from '@/lib/actions/taskActions';
import { Checkbox } from '../ui/checkbox';
import {
  ChevronDownIcon,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CircleAlertIcon,
  CircleXIcon,
  Columns3Icon,
  FilterIcon,
  ListFilterIcon,
  TrashIcon,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '../ui/pagination';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { capitalizeFirstLetter } from '@/lib/heplers';
import moment from 'moment';
import { deleteTaskByIdAction } from '@/lib/actions/taskActions';
import UpdateTaskStatus from './UpdateStatusDialog';

const statusFilterFn: FilterFn<TableTask> = (
  row,
  columnId,
  filterValue: string[]
) => {
  if (!filterValue?.length) return true;
  const status = row.getValue(columnId) as string;
  return filterValue.includes(status);
};

const columns: ColumnDef<TableTask>[] = [
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
    size: 28,
    enableSorting: false,
  },
  {
    header: 'Task Type',
    accessorKey: 'type',
    cell: ({ row }) => {
      return (
        <div className=''>{capitalizeFirstLetter(row.getValue('type'))}</div>
      );
    },
  },
  {
    header: 'Assigne Name',
    accessorKey: 'team_members',
    cell: ({ row }) => {
      return (
        <div className=''>
          {row.original.team_members
            ? row.original.team_members.first_name +
              ' ' +
              row.original.team_members.last_name
            : 'Unassigned'}
        </div>
      );
    },
  },
  {
    header: 'Property Title',
    accessorKey: 'properties',
    cell: ({ row }) => {
      return <div className=''>{row.original.property.title}</div>;
    },
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }) => {
      return (
        <div className='flex items-center gap-1'>
          <Badge
            variant='outline'
            className='border-none gap-2 text-md font-normal items-baseline'>
            <span
              className={cn(
                'size-1.5 rounded-full',
                row.getValue('status') === 'pending' && 'bg-amber-500',
                row.getValue('status') === 'accepted' && 'bg-blue-500',
                row.getValue('status') === 'in_progress' && 'bg-indigo-500',
                row.getValue('status') === 'completed' && 'bg-green-500'
              )}
              aria-hidden='true'></span>
            {row.getValue('status')}
          </Badge>

          <UpdateTaskStatus
            taskId={row.original.id}
            taskStatus={row.original.status}
          />
        </div>
      );
    },
    filterFn: statusFilterFn,
  },
  {
    header: 'Scheduled Date',
    accessorKey: 'scheduled_date',
    cell: ({ row }) => {
      return (
        <div className=''>
          {moment(row.getValue('scheduled_date')).format('DD-MM-YYYY')}
        </div>
      );
    },
  },
];

export default function TasksTable({
  tableTasks,
}: {
  tableTasks: TableTask[];
}) {
  const [tasks, setTasks] = useState<TableTask[]>(tableTasks);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  useEffect(() => {
    setTasks(tableTasks);
  }, [tableTasks]);
  const table = useReactTable({
    data: tasks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Get unique status values
  const uniqueStatusValues = useMemo(() => {
    const statusColumn = table.getColumn('status');

    if (!statusColumn) return [];

    const values = Array.from(statusColumn.getFacetedUniqueValues().keys());
    // console.log('Status values: ', statusColumn?.getFacetedUniqueValues());

    return values.sort();
  }, [table.getColumn('status')?.getFacetedUniqueValues()]);

  // Get counts for each status
  const statusCounts = useMemo(() => {
    const statusColumn = table.getColumn('status');
    if (!statusColumn) return new Map();
    return statusColumn.getFacetedUniqueValues();
  }, [table.getColumn('status')?.getFacetedUniqueValues()]);

  const selectedStatuses = useMemo(() => {
    const filterValue = table.getColumn('status')?.getFilterValue() as string[];
    return filterValue ?? [];
  }, [table.getColumn('status')?.getFilterValue()]);

  const handleStatusChange = (checked: boolean, value: string) => {
    const filterValue = table.getColumn('status')?.getFilterValue() as string[];
    const newFilterValue = filterValue ? [...filterValue] : [];

    if (checked) {
      newFilterValue.push(value);
    } else {
      const index = newFilterValue.indexOf(value);
      if (index > -1) {
        newFilterValue.splice(index, 1);
      }
    }

    table
      .getColumn('status')
      ?.setFilterValue(newFilterValue.length ? newFilterValue : undefined);
  };

  // Delete rows function
  const handleDeleteRows = async (rowsData: Row<TableTask>[]) => {
    const taskIds = rowsData?.map((row) => {
      return row.original.id;
    });

    const response = await deleteTaskByIdAction(taskIds);
    table.toggleAllRowsSelected(false);
    console.log('response deleting tasks: ', response);
  };

  return (
    <div className='space-y-4'>
      {/* Filters */}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex items-center gap-3'>
          {/* Filter by name or email */}
          <div className='relative'>
            <Input
              id={`${id}-input`}
              ref={inputRef}
              className={cn(
                'peer min-w-60 ps-9',
                Boolean(table.getColumn('type')?.getFilterValue()) && 'pe-9'
              )}
              value={
                (table.getColumn('type')?.getFilterValue() ?? '') as string
              }
              onChange={(e) =>
                table.getColumn('type')?.setFilterValue(e.target.value)
              }
              placeholder='Filter by task type or email...'
              type='text'
              aria-label='Filter by task type or email'
            />
            <div className='pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50'>
              <ListFilterIcon size={16} aria-hidden='true' />
            </div>
            {Boolean(table.getColumn('type')?.getFilterValue()) && (
              <button
                className='absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 transition-[color,box-shadow] outline-none hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
                aria-label='Clear filter'
                onClick={() => {
                  table.getColumn('type')?.setFilterValue('');
                  if (inputRef.current) {
                    inputRef.current.focus();
                  }
                }}>
                <CircleXIcon size={16} aria-hidden='true' />
              </button>
            )}
          </div>
          {/* Filter by status */}
          <Popover>
            <PopoverTrigger asChild>
              <Button className='w-32' variant='outline'>
                <FilterIcon
                  className='-ms-1 opacity-60'
                  size={16}
                  aria-hidden='true'
                />
                Status
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto min-w-44 p-3' align='start'>
              <div className='space-y-3'>
                <div className='text-xs font-medium text-muted-foreground'>
                  Filters
                </div>
                <div className='space-y-3'>
                  {uniqueStatusValues.map((value, i) => (
                    <div key={value} className='flex items-center gap-2'>
                      <Checkbox
                        id={`${id}-${i}`}
                        checked={selectedStatuses.includes(value)}
                        onCheckedChange={(checked: boolean) =>
                          handleStatusChange(checked, value)
                        }
                      />
                      <Label
                        htmlFor={`${id}-${i}`}
                        className='flex grow justify-between gap-2 font-normal'>
                        {value}{' '}
                        <span className='ms-2 text-xs text-muted-foreground'>
                          {statusCounts.get(value)}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          {/* Filter by Property */}
          <Popover>
            <PopoverTrigger asChild>
              <Button className='w-32' variant='outline'>
                <FilterIcon
                  className='-ms-1 opacity-60'
                  size={16}
                  aria-hidden='true'
                />
                Property
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto min-w-44 p-3' align='start'>
              <div className='space-y-3'>
                <div className='text-xs font-medium text-muted-foreground'>
                  Filters
                </div>
                <div className='space-y-3'>
                  {uniqueStatusValues.map((value, i) => (
                    <div key={value} className='flex items-center gap-2'>
                      <Checkbox
                        id={`${id}-${i}`}
                        checked={selectedStatuses.includes(value)}
                        onCheckedChange={(checked: boolean) =>
                          handleStatusChange(checked, value)
                        }
                      />
                      <Label
                        htmlFor={`${id}-${i}`}
                        className='flex grow justify-between gap-2 font-normal'>
                        {value}{' '}
                        <span className='ms-2 text-xs text-muted-foreground'>
                          {statusCounts.get(value)}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          {/* Toggle columns visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' className='w-32'>
                <Columns3Icon
                  className='-ms-1 opacity-60'
                  size={16}
                  aria-hidden='true'
                />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className='capitalize'
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                      onSelect={(event) => event.preventDefault()}>
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className='flex items-center gap-3'>
          {/* Delete button */}
          {table.getSelectedRowModel().rows.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className='ml-auto' variant='outline'>
                  <TrashIcon
                    className='-ms-1 opacity-60'
                    size={16}
                    aria-hidden='true'
                  />
                  Delete
                  <span className='-me-1 inline-flex h-5 max-h-full items-center rounded border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70'>
                    {table.getSelectedRowModel().rows.length}
                  </span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <div className='flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4'>
                  <div
                    className='flex size-9 shrink-0 items-center justify-center rounded-full text-red-500 border'
                    aria-hidden='true'>
                    <CircleAlertIcon
                      className='text-red-500 opacity-80'
                      size={16}
                    />
                  </div>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete{' '}
                      {table.getSelectedRowModel().rows.length} selected{' '}
                      {table.getSelectedRowModel().rows.length === 1
                        ? 'row'
                        : 'rows'}
                      .
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      handleDeleteRows(table.getSelectedRowModel().rows)
                    }>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Table */}
      <div className='overflow-hidden rounded-sm border border-border bg-background'>
        <Table className='table-fixed'>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className='border-border hover:bg-transparent'>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: `${header.getSize()}px` }}
                      className='h-11 font-semibold text-foreground'>
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <div
                          className={cn(
                            header.column.getCanSort() &&
                              'flex h-full cursor-pointer items-center justify-between gap-2 select-none'
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                          onKeyDown={(e) => {
                            // Enhanced keyboard handling for sorting
                            if (
                              header.column.getCanSort() &&
                              (e.key === 'Enter' || e.key === ' ')
                            ) {
                              e.preventDefault();
                              header.column.getToggleSortingHandler()?.(e);
                            }
                          }}
                          tabIndex={header.column.getCanSort() ? 0 : undefined}>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: (
                              <ChevronUpIcon
                                className='shrink-0 opacity-60'
                                size={16}
                                aria-hidden='true'
                              />
                            ),
                            desc: (
                              <ChevronDownIcon
                                className='shrink-0 opacity-60'
                                size={16}
                                aria-hidden='true'
                              />
                            ),
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className='border-border'
                  data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className='last:py-0'>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'>
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pqgination */}
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div className='flex items-center gap-4'>
          {/* Page number information */}
          <div className='flex grow justify-end text-sm whitespace-nowrap text-muted-foreground'>
            <p
              className='text-sm whitespace-nowrap text-muted-foreground'
              aria-live='polite'>
              <span className='text-foreground'>
                {table.getState().pagination.pageIndex *
                  table.getState().pagination.pageSize +
                  1}
                -
                {Math.min(
                  Math.max(
                    table.getState().pagination.pageIndex *
                      table.getState().pagination.pageSize +
                      table.getState().pagination.pageSize,
                    0
                  ),
                  table.getRowCount()
                )}
              </span>{' '}
              of{' '}
              <span className='text-foreground'>
                {table.getRowCount().toString()}
              </span>
            </p>
          </div>
          <Pagination>
            <PaginationContent>
              {/* Go to first page button */}
              <PaginationItem>
                <Button
                  size='icon'
                  variant='outline'
                  className='disabled:pointer-events-none disabled:opacity-50'
                  onClick={() => table.firstPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label='Go to first page'>
                  <ChevronFirstIcon size={16} aria-hidden='true' />
                </Button>
              </PaginationItem>
              {/* Previous page button */}
              <PaginationItem>
                <Button
                  size='icon'
                  variant='outline'
                  className='disabled:pointer-events-none disabled:opacity-50'
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label='Go to previous page'>
                  <ChevronLeftIcon size={16} aria-hidden='true' />
                </Button>
              </PaginationItem>
              {/* Next page button */}
              <PaginationItem>
                <Button
                  size='icon'
                  variant='outline'
                  className='disabled:pointer-events-none disabled:opacity-50'
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label='Go to next page'>
                  <ChevronRightIcon size={16} aria-hidden='true' />
                </Button>
              </PaginationItem>
              {/* Go to last page button */}
              <PaginationItem>
                <Button
                  size='icon'
                  variant='outline'
                  className='disabled:pointer-events-none disabled:opacity-50'
                  onClick={() => table.lastPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label='Go to last page'>
                  <ChevronLastIcon size={16} aria-hidden='true' />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
