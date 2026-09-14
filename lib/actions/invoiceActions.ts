'use server';

import { createClient } from '@/lib/utils/supabase/server';

export async function fetchInvoicesAction() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, data: [], error: 'Unauthorized' };
  }

  const { data, error } = await supabase
    .from('invoices')
    .select(
      `
      id,
      status,
      total_gross_amount,
      client_name,
      created_at,
      bookings!inner (
        id,
        booking_uid,
        start_date,
        end_date,
        guest_name,
        properties!inner (
          id,
          title,
          owner_id
        )
      )
    `,
    )
    .eq('bookings.properties.owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('⚠️ Error fetching invoices:', error);
    return { success: false, data: [], error: error.message };
  }

  return { success: true, data };
}

export async function updateInvoiceReadyAction(
  invoiceId: string,
  payload: { client_name: string; total_gross_amount: number },
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('invoices')
    .update({
      client_name: payload.client_name,
      total_gross_amount: payload.total_gross_amount,
      status: 'ready', // Promote the invoice from 'draft' to 'ready'
    })
    .eq('id', invoiceId);

  if (error) {
    console.error('⚠️ Error updating invoice:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
