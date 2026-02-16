'use client';

import * as React from 'react';
import { Table } from '@tanstack/react-table';
import { FilterIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { TableBooking } from '@/types/bookingTypes';

interface StatusFilterProps {
  table: Table<TableBooking>;
}

export function StatusFilter({ table }: StatusFilterProps) {
  const column = table.getColumn('status');
  const id = React.useId();

  if (!column) return null;

  const sortedUniqueValues = React.useMemo(() => {
    const values = Array.from(column.getFacetedUniqueValues().keys());
    return values.sort();
  }, [column.getFacetedUniqueValues()]);

  const selectedValues = new Set(column.getFilterValue() as string[]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' size='sm' className='h-8 border-dashed'>
          <FilterIcon className='mr-2 h-4 w-4' />
          Status
          {selectedValues?.size > 0 && (
            <>
              <div className='mx-2 h-4 w-[1px] bg-accent' />
              <div className='flex items-center text-xs text-muted-foreground'>
                {selectedValues.size}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[200px] p-0' align='start'>
        <div className='p-4 space-y-4'>
           <div className='space-y-2'>
            <h4 className='font-medium leading-none'>Filter Status</h4>
            <p className='text-sm text-muted-foreground'>
              Select statuses to display
            </p>
          </div>
          <div className='space-y-2'>
            {sortedUniqueValues.map((value, i) => (
               <div key={value} className='flex items-center space-x-2'>
                <Checkbox
                  id={`${id}-${i}`}
                  checked={selectedValues.has(value)}
                  onCheckedChange={(checked) => {
                     const newSet = new Set(selectedValues);
                     if (checked) {
                       newSet.add(value);
                     } else {
                       newSet.delete(value);
                     }
                     const filterValue = Array.from(newSet);
                     column.setFilterValue(
                       filterValue.length ? filterValue : undefined
                     );
                  }}
                />
                <Label
                  htmlFor={`${id}-${i}`}
                  className='text-sm font-normal capitalize'
                >
                  {value}
                  <span className='ml-auto pl-2 text-xs text-muted-foreground'>
                    {column.getFacetedUniqueValues().get(value)}
                  </span>
                </Label>
              </div>
            ))}
          </div>
           {selectedValues.size > 0 && (
            <Button
              variant='ghost'
              onClick={() => column.setFilterValue(undefined)}
              className='w-full justify-center text-xs'
            >
              Clear filters
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
