'use client';

import { useState } from 'react';
import { MoreHorizontal, FileSearch, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InvoiceReviewSheet } from './InvoiceReviewSheet';
import { transmitInvoiceAction } from '@/lib/actions/aadeActions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { TableInvoice } from '@/types/invoiceTypes';

interface InvoiceActionsCellProps {
  invoice: TableInvoice;
}

export function InvoiceActionsCell({ invoice }: InvoiceActionsCellProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const router = useRouter();

  const handleTransmit = async () => {
    setIsTransmitting(true);
    toast.loading('Transmitting to AADE...', { id: 'aade-toast' });

    const result = await transmitInvoiceAction(invoice.id);

    if (result.success) {
      toast.success(`Success! MARK: ${result.mark}`, { id: 'aade-toast' });
      router.refresh(); // Automatically refresh the table data
    } else {
      toast.error(result.error, { id: 'aade-toast' });
    }

    setIsTransmitting(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='h-8 w-8 p-0'
            disabled={isTransmitting}>
            {isTransmitting ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <MoreHorizontal className='h-4 w-4' />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={() => setTimeout(() => setIsSheetOpen(true), 0)}>
            <FileSearch className='mr-2 h-4 w-4' />
            Review & Edit
          </DropdownMenuItem>

          {/* Only show Transmit button if the invoice has been approved/ready */}
          {invoice.status === 'ready' && (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault(); // Prevent menu from closing immediately
                handleTransmit();
              }}
              className='text-blue-600 focus:text-blue-700 font-medium'>
              <Send className='mr-2 h-4 w-4' />
              Transmit to AADE
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <InvoiceReviewSheet
        invoice={invoice}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </>
  );
}
