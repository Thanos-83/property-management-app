import React from 'react';
import InvoicesTable from '@/components/invoices/InvoicesTable';
import { fetchInvoicesAction } from '@/lib/actions/invoiceActions';
import { TableInvoice } from '@/types/invoiceTypes';

export default async function InvoicesPage() {
  // Use the server action to fetch data
  const result = await fetchInvoicesAction();
  const invoices = result.success
    ? (result.data as unknown as TableInvoice[])
    : [];

  return (
    <div className='group flex-1 overflow-y-auto p-4'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold mb-2'>AADE Draft Invoices</h1>
        <p className='text-sm text-muted-foreground'>
          Review and approve your AI-extracted invoice drafts before
          transmitting them to myDATA.
        </p>
      </div>

      <InvoicesTable data={invoices} />
    </div>
  );
}
