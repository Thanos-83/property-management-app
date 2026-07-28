'use client';

import { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react';

interface TaskTablePaginationProps<TData> {
  table: Table<TData>;
}

export default function TaskTablePagination<TData>({
  table,
}: TaskTablePaginationProps<TData>) {
  return (
    <div className='flex flex-wrap items-center justify-between gap-4 py-4'>
      <div className='flex items-center gap-4 w-full'>
        <div className='flex grow text-md text-muted-foreground'>
          <p aria-live='polite'>
            Showing{' '}
            <span className='text-foreground font-medium'>
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1}
            </span>{' '}
            to{' '}
            <span className='text-foreground font-medium'>
              {Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                table.getRowCount(),
              )}
            </span>{' '}
            of{' '}
            <span className='text-foreground font-medium'>
              {table.getRowCount()}
            </span>{' '}
            rows
          </p>
        </div>

        <div className='flex items-center space-x-2'>
          <Button
            size='icon'
            variant='outline'
            onClick={() => table.firstPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label='Go to first page'>
            <ChevronFirstIcon size={16} />
          </Button>
          <Button
            size='icon'
            variant='outline'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label='Go to previous page'>
            <ChevronLeftIcon size={16} />
          </Button>
          <Button
            size='icon'
            variant='outline'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label='Go to next page'>
            <ChevronRightIcon size={16} />
          </Button>
          <Button
            size='icon'
            variant='outline'
            onClick={() => table.lastPage()}
            disabled={!table.getCanNextPage()}
            aria-label='Go to last page'>
            <ChevronLastIcon size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
