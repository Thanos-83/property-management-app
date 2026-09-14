'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import moment from 'moment';
import {
  CalendarIcon,
  HomeIcon,
  UserIcon,
  EuroIcon,
  //   FileText,
} from 'lucide-react';
import { InvoiceActionsCell } from '@/components/invoices/InvoiceActionsCell';
import { TableInvoice } from '@/types/invoiceTypes';

const getAadeStatusStyles = (status: string) => {
  switch (status.toLowerCase()) {
    case 'transmitted':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'ready':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'draft':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const invoiceColumns: ColumnDef<TableInvoice>[] = [
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
    accessorKey: 'client_name',
    header: 'Client / Guest',
    cell: ({ row }) => {
      // Fallback to the booking guest_name if client_name is missing
      const name =
        row.original.client_name ||
        row.original.bookings?.guest_name ||
        'Unknown Client';
      return (
        <div className='flex items-center gap-2 font-medium'>
          <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary'>
            <UserIcon size={14} />
          </div>
          <span>{name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'property',
    header: 'Property',
    cell: ({ row }) => {
      return (
        <div className='flex items-center gap-2 text-muted-foreground'>
          <HomeIcon size={14} />
          <span>
            {row.original.bookings?.properties?.title || 'Unknown Property'}
          </span>
        </div>
      );
    },
    accessorFn: (row) => row.bookings?.properties?.title,
  },
  {
    accessorKey: 'dates',
    header: 'Stay Dates',
    sortingFn: (rowA, rowB) => {
      const dateA = new Date(rowA.original.bookings.start_date).getTime();
      const dateB = new Date(rowB.original.bookings.start_date).getTime();
      return dateA - dateB;
    },
    cell: ({ row }) => {
      const start = moment(row.original.bookings?.start_date);
      const end = moment(row.original.bookings?.check_out);
      return (
        <div className='flex items-center gap-1 text-sm text-muted-foreground'>
          <CalendarIcon size={14} className='opacity-70' />
          <span>{start.format('MMM D')}</span>
          <span>→</span>
          <span>{end.format('MMM D, YYYY')}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'total_gross_amount',
    header: 'Gross Amount',
    cell: ({ row }) => {
      const amount = row.original.total_gross_amount || 0;
      // Formatting natively for Greece (Euros)
      const formatted = new Intl.NumberFormat('el-GR', {
        style: 'currency',
        currency: 'EUR',
      }).format(amount);

      return (
        <div className='font-semibold text-foreground'>
          {amount === 0 ? (
            <span className='text-amber-600 flex items-center gap-1'>
              <EuroIcon size={14} /> Missing Data
            </span>
          ) : (
            formatted
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'AADE Status',
    cell: ({ row }) => {
      const status = row.original.status || 'draft';
      return (
        <Badge
          className={cn(
            'capitalize shadow-sm border font-medium tracking-wide',
            getAadeStatusStyles(status),
          )}>
          {status}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return <InvoiceActionsCell invoice={row.original} />;
    },
    size: 40,
  },
];
