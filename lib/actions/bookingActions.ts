'use server';

import { createClient } from '../utils/supabase/server';
import { BookingEvent, TableBooking } from '@/types/bookingTypes';
import { TASK_DETAILS_QUERY } from '@/lib/constants/queries';

export const fetchBookingsAction = async () => {
  try {
    const supabase = await createClient();

    // const {
    //   data: { user },
    // } = await supabase.auth.getUser();

    // Fetch bookings directly from the bookings table
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(
        `
        *,
        property:properties!property_id (
          title,
          location
        ),
        tasks (${TASK_DETAILS_QUERY}) 
        `,
      )
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }

    // console.log('Bookings Tasks: ', bookings[1]?.tasks)

    return (bookings as unknown as TableBooking[]) || [];
  } catch (error) {
    console.error('Unexpected error fetching bookings:', error);
    return [];
  }
};
export const updateBookingAction = async (
  data: Partial<BookingEvent> & { id: string },
) => {
  try {
    const supabase = await createClient();
    const { id, ...updates } = data;
    console.log('Booking Data: ', data);
    const { error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating booking:', error);
      return { success: false, error: error.message };
    }

    // revalidatePath('/dashboard/bookings');
    // revalidateTag('bookings')
    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error updating booking:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

export const deleteBookingAction = async (bookingId: string) => {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId);

    if (error) {
      console.error('Error deleting booking:', error);
      return { success: false, error: error.message };
    }

    // revalidatePath('/dashboard/bookings');
    // revalidateTag('bookings')
    return { success: true };
  } catch (error) {
    console.error('Unexpected error deleting booking:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};
