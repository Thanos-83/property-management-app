'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { Loader2, Building2, User, Send } from 'lucide-react';
import moment from 'moment';
import { TableInvoice } from '@/types/invoiceTypes';
import { updateInvoiceReadyAction } from '@/lib/actions/invoiceActions';
import { useRouter } from 'next/navigation';

const invoiceSchema = z.object({
  client_name: z.string().min(1, 'Client name is required'),
  total_gross_amount: z.number().min(0.01, 'Amount must be greater than 0'),
});

type InvoiceFormInput = z.infer<typeof invoiceSchema>;

interface InvoiceReviewSheetProps {
  invoice: TableInvoice;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceReviewSheet({
  invoice,
  isOpen,
  onOpenChange,
}: InvoiceReviewSheetProps) {
  const router = useRouter();
  const form = useForm<InvoiceFormInput>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      client_name: '',
      total_gross_amount: 0,
    },
  });

  // Load the AI-extracted data when the sheet opens
  useEffect(() => {
    if (invoice && isOpen) {
      form.reset({
        client_name: invoice.client_name || invoice.bookings?.guest_name || '',
        total_gross_amount: invoice.total_gross_amount || 0,
      });
    }
  }, [invoice, isOpen, form]);

  const onSubmit = async (data: InvoiceFormInput) => {
    try {
      const result = await updateInvoiceReadyAction(invoice.id, data);

      if (result.success) {
        toast.success('Invoice marked as ready for AADE!');
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error('Failed to update invoice.');
        console.error(result.error);
      }
    } catch (error) {
      console.error(error);
      toast.error('An unexpected error occurred.');
    }
  };

  if (!invoice) return null;

  const start = moment(invoice.bookings?.start_date).format('MMM D, YYYY');
  const end = moment(invoice.bookings?.check_out).format('MMM D, YYYY');

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className='p-0 flex flex-col w-full sm:max-w-[550px] bg-background border-l border-border'>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex flex-col h-full overflow-hidden'>
            {/* STICKY HEADER */}
            <div className='p-4 border-b border-border bg-white shrink-0'>
              <SheetHeader className='text-left space-y-0'>
                <div className='flex items-center justify-between gap-3 mb-1.5 w-full'>
                  <div className='flex items-center gap-3'>
                    <SheetTitle className='text-xl font-black text-foreground'>
                      Invoice Review
                    </SheetTitle>
                    <Badge className='text-[10px] uppercase tracking-wider shadow-sm border bg-amber-100 text-amber-700 border-amber-200'>
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
                <SheetDescription className='text-xs font-medium text-muted-foreground'>
                  {invoice.bookings?.booking_uid || 'No UID'} • {start} - {end}
                </SheetDescription>
              </SheetHeader>
            </div>

            {/* SCROLLABLE BODY */}
            <div className='flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50'>
              {/* SECTION 1: Booking Context (Read-Only) */}
              <div className='bg-white border border-border rounded-sm p-5 shadow-sm space-y-4'>
                <h3 className='text-sm font-bold text-foreground flex items-center gap-2'>
                  <Building2 className='w-4 h-4 text-muted-foreground' />{' '}
                  Booking Details
                </h3>
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <p className='text-xs text-muted-foreground mb-1'>
                      Property
                    </p>
                    <p className='font-medium'>
                      {invoice.bookings?.properties?.title}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-muted-foreground mb-1'>
                      Booking Guest
                    </p>
                    <p className='font-medium'>
                      {invoice.bookings?.guest_name}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 2: AADE Tax Data (Editable) */}
              <div className='bg-white border border-border rounded-sm p-5 shadow-sm space-y-4'>
                <h3 className='text-sm font-bold text-foreground flex items-center gap-2'>
                  <User className='w-4 h-4 text-muted-foreground' /> Tax
                  Reporting Data
                </h3>
                <div className='space-y-4'>
                  <FormField
                    control={form.control}
                    name='client_name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-xs text-muted-foreground'>
                          Billed To (Client Name)
                        </FormLabel>
                        <FormControl>
                          <Input
                            className='bg-white border-border'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='total_gross_amount'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-xs text-muted-foreground'>
                          Total Gross Amount (AI Extracted)
                        </FormLabel>
                        <FormControl>
                          <div className='relative'>
                            <span className='absolute left-3 top-2.5 text-muted-foreground font-medium'>
                              €
                            </span>
                            <Input
                              className='pl-8 bg-white border-border font-medium text-lg text-green-700'
                              type='number'
                              step='0.01'
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* STICKY FOOTER */}
            <div className='p-4 border-t border-border bg-card shrink-0 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]'>
              <div className='flex gap-2 w-full'>
                <Button
                  variant='outline'
                  type='button'
                  className='bg-background border-border hover:bg-muted font-semibold w-1/3'
                  onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={form.formState.isSubmitting}
                  className='font-bold shadow-sm w-2/3 bg-blue-600 hover:bg-blue-700 text-white'>
                  {form.formState.isSubmitting ? (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  ) : (
                    <Send className='mr-2 h-4 w-4' />
                  )}
                  {form.formState.isSubmitting
                    ? 'Saving...'
                    : 'Approve & Mark Ready'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
