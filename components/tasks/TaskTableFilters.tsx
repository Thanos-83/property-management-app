'use client';

import { Table, Row } from '@tanstack/react-table';
import { TableTask } from '@/types/taskTypes';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  CircleAlertIcon,
  CircleXIcon,
  Columns3Icon,
  FilterIcon,
  ListFilterIcon,
  TrashIcon,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';

interface TaskTableFiltersProps {
  table: Table<TableTask>;
  globalFilter: string;
  setGlobalFilter: (val: string) => void;
  onDeleteRows: (rows: Row<TableTask>[]) => Promise<void>;
  isDeleting: boolean;
}

export default function TaskTableFilters({
  table,
  globalFilter,
  setGlobalFilter,
  onDeleteRows,
  isDeleting,
}: TaskTableFiltersProps) {
  // Extract Unique Values for Status
  const statuses = useMemo(() => {
    const col = table.getColumn('status');
    if (!col) return { unique: [], counts: new Map() };
    return {
      unique: Array.from(col.getFacetedUniqueValues().keys()).sort(),
      counts: col.getFacetedUniqueValues(),
    };
  }, [table.getColumn('status')?.getFacetedUniqueValues()]);

  // Extract Unique Values for Property
  const properties = useMemo(() => {
    const col = table.getColumn('property');
    if (!col) return { unique: [], counts: new Map() };
    return {
      unique: Array.from(col.getFacetedUniqueValues().keys()).sort(),
      counts: col.getFacetedUniqueValues(),
    };
  }, [table.getColumn('property')?.getFacetedUniqueValues()]);

  const handleFilterChange = (
    columnId: string,
    checked: boolean,
    value: string,
  ) => {
    const filterValue =
      (table.getColumn(columnId)?.getFilterValue() as string[]) || [];
    const newFilterValue = checked
      ? [...filterValue, value]
      : filterValue.filter((v) => v !== value);

    table
      .getColumn(columnId)
      ?.setFilterValue(newFilterValue.length ? newFilterValue : undefined);
  };

  return (
    <div className='flex flex-wrap items-center justify-between gap-3'>
      <div className='flex items-center gap-3'>
        {/* Global Search */}
        <div className='relative'>
          <Input
            className={cn('peer min-w-60 ps-9', globalFilter && 'pe-9')}
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder='Search tasks, properties, assignees...'
          />
          <div className='pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80'>
            <ListFilterIcon size={16} />
          </div>
          {globalFilter && (
            <button
              className='absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 hover:text-foreground'
              onClick={() => setGlobalFilter('')}>
              <CircleXIcon size={16} />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <FilterPopover
          title='Status'
          columnId='status'
          table={table}
          uniqueValues={statuses.unique}
          counts={statuses.counts}
          onFilterChange={handleFilterChange}
        />

        {/* Property Filter */}
        <FilterPopover
          title='Property'
          columnId='property'
          table={table}
          uniqueValues={properties.unique}
          counts={properties.counts}
          onFilterChange={handleFilterChange}
        />

        {/* Columns View Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' className='w-32'>
              <Columns3Icon className='-ms-1 opacity-60 mr-2' size={16} />
              View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            {table
              .getAllColumns()
              .filter((col) => col.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className='capitalize'
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  onSelect={(e) => e.preventDefault()}>
                  {column.id.replace('_', ' ')}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete Button */}
      {table.getSelectedRowModel().rows.length > 0 && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant='outline'
              className='text-destructive hover:bg-destructive/10 hover:text-destructive'>
              <TrashIcon className='-ms-1 opacity-80 mr-2' size={16} />
              Delete ({table.getSelectedRowModel().rows.length})
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className='flex items-center gap-3'>
                <CircleAlertIcon className='text-destructive' size={24} />
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              </div>
              <AlertDialogDescription>
                This will permanently delete{' '}
                {table.getSelectedRowModel().rows.length} selected tasks.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className='bg-destructive hover:bg-destructive/90'
                disabled={isDeleting}
                onClick={(e) => {
                  e.preventDefault();
                  onDeleteRows(table.getSelectedRowModel().rows);
                }}>
                {isDeleting ? (
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                ) : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

// Reusable Popover Component for Filters
function FilterPopover({
  title,
  columnId,
  table,
  uniqueValues,
  counts,
  onFilterChange,
}: any) {
  const selectedValues =
    (table.getColumn(columnId)?.getFilterValue() as string[]) || [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className='w-32' variant='outline'>
          <FilterIcon className='-ms-1 opacity-60 mr-2' size={16} />
          {title}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto min-w-44 p-3' align='start'>
        <div className='space-y-3'>
          <div className='text-xs font-medium text-muted-foreground'>
            Filters
          </div>
          <div className='space-y-3'>
            {uniqueValues.map((value: string) => (
              <div key={value} className='flex items-center gap-2'>
                <Checkbox
                  id={`${columnId}-${value}`}
                  checked={selectedValues.includes(value)}
                  onCheckedChange={(checked: boolean) =>
                    onFilterChange(columnId, checked, value)
                  }
                />
                <Label
                  htmlFor={`${columnId}-${value}`}
                  className='flex grow justify-between gap-2 font-normal text-sm cursor-pointer'>
                  {value}{' '}
                  <span className='text-xs text-muted-foreground'>
                    {counts.get(value)}
                  </span>
                </Label>
              </div>
            ))}
            {uniqueValues.length === 0 && (
              <div className='text-xs text-muted-foreground'>No data</div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
