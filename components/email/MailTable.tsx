'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  Row,
  PaginationState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination';
import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Trash2,
  Archive,
  Mail,
  MailOpen,
  Inbox,
} from 'lucide-react';
import { EmailSummary } from '@/lib/actions/emailActions';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Image from 'next/image';

interface MailTableProps {
  data: EmailSummary[];
  loading?: boolean;
  onSelectMail: (id: string) => void;
  selectedMailId: string | null;
  accountId: string;
}

export function MailTable({
  data,
  loading,
  onSelectMail,
  selectedMailId,
  accountId,
}: MailTableProps) {
  // Selection State
  const [rowSelection, setRowSelection] = React.useState({});
  
  // Pagination State
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Action Helpers
  const handleAction = (e: React.MouseEvent, action: string, email: EmailSummary) => {
    e.stopPropagation();
    toast.info(`${action} - Not implemented yet`);
  };

  const columns: ColumnDef<EmailSummary>[] = [
    // Column 1: Checkbox
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
           <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-[2px]"
          />
        </div>
      ),
      size: 40,
      enableSorting: false,
    },
    // Column 2: Sender & Subject (Multi-row)
    {
      id: 'sender_subject',
      accessorFn: (row) => `${row.from.name} ${row.subject}`,
      cell: ({ row }) => {
        const email = row.original;
        const isRead = email.sysLabels.includes('seen');
        const isUnread = !isRead;

        return (
          <div className="flex flex-col gap-1 w-full max-w-full overflow-hidden">
            {/* Row 1: Sender */}
            <div className={cn("text-sm truncate", isUnread ? "font-bold text-foreground" : "text-muted-foreground font-medium")}>
              {email.from.name || email.from.address}
            </div>
            {/* Row 2: Subject */}
            <div className={cn("text-sm truncate", isUnread ? "font-bold text-foreground" : "text-muted-foreground")}>
               {email.subject || '(No Subject)'}
            </div>
          </div>
        );
      },
      size: 250,
    },
    // Column 3: Description (Middle Aligned)
    {
      id: 'snippet',
      accessorKey: 'bodySnippet',
      cell: ({ row }) => {
        return (
           <div className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1">
             {row.original.bodySnippet}
           </div>
        );
      },
    },
    // Column 4: Timestamp & Actions
    {
      id: 'meta',
      cell: ({ row }) => {
         const email = row.original;
         const received = new Date(email.receivedAt);
         const isRead = email.sysLabels.includes('seen');

         return (
             <div className="flex flex-col items-end gap-2 text-right">
                 {/* Row 1: Time */}
                 <div className={cn("text-xs whitespace-nowrap", !isRead ? "font-bold text-blue-600 dark:text-blue-400" : "text-muted-foreground")}>
                     {formatDistanceToNow(received, { addSuffix: true })}
                 </div>
                 
                 {/* Row 2: Actions (Quick) */}
                 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={(e) => handleAction(e, 'Delete', email)}
                     >
                         <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                     </Button>
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={(e) => handleAction(e, 'Archive', email)}
                      >
                         <Archive className="h-4 w-4 text-muted-foreground" />
                     </Button>
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={(e) => handleAction(e, isRead ? 'Mark Unread' : 'Mark Read', email)}
                      >
                         {isRead ? (
                             <Mail className="h-4 w-4 text-muted-foreground" />
                         ) : (
                             <MailOpen className="h-4 w-4 text-blue-500" />
                         )}
                     </Button>
                 </div>
             </div>
         )
      },
      size: 120,
    }
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      rowSelection,
      pagination,
    },
  });

  if (loading) {
      return (
          <div className="p-8 text-center text-muted-foreground animate-pulse">
              Loading emails...
          </div>
      )
  }

  if (data.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center p-8 text-center h-[50vh]">
             <div className=" rounded-full  mb-4">
                  <Image 
                    src="/images/empty_inbox_illustration.png" 
                    alt="Empty Inbox" 
                    width={250} 
                    height={250} 
                    className="opacity-90 grayscale-[0.2]"
                    priority
                  />
               </div>
              <h3 className="font-semibold text-lg mb-1">All caught up!</h3>
              <p className="text-muted-foreground text-sm">You have no emails in this folder.</p>
          </div>
      )
  }


  return (
    <div className="flex flex-col h-full space-y-4 p-4">
      {/* Selection Toolbar (Could go here) */}
      {Object.keys(rowSelection).length > 0 && (
          <div className="bg-muted/50 p-2 flex items-center justify-between px-4 animate-in fade-in slide-in-from-top-2">
              <span className="text-sm font-medium">{Object.keys(rowSelection).length} selected</span>
              <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={() => toast.info('Bulk Delete')}>Delete</Button>
                  <Button size="sm" variant="outline" onClick={() => toast.info('Bulk Archive')}>Archive</Button>
              </div>
          </div>
      )}

      {/* Table */}
      <div className="bg-card">
        <Table>
          {/* No Header as requested */}
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer group hover:bg-muted/50 border-b border-b-muted-foreground/10 transition-colors"
                  onClick={() => onSelectMail(row.original.id)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id} 
                      style={{ 
                        width: cell.column.id === 'snippet' ? 'auto' : cell.column.getSize(),
                        maxWidth: cell.column.id === 'sender_subject' ? '250px' : 'none'
                      }}
                      className={cell.column.id === 'snippet' ? 'w-full' : ''}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="py-4">

        <Pagination className='flex items-center justify-end'>
          <div className="text-xs text-muted-foreground mr-4 flex items-center">
            <span className="mr-2">Page</span>
             {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
            {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} of {table.getFilteredRowModel().rows.length}
          </div>
          <PaginationContent>
                 <PaginationItem>
                    <Button
                    variant="outline"
                    size="icon"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    >
                    <ChevronLeftIcon className="h-4 w-4" />
                    </Button>
                </PaginationItem>
                <PaginationItem>
                    <Button
                    variant="outline"
                    size="icon"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    >
                    <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
