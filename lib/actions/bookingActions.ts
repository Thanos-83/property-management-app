'use server';

import { createClient } from '../utils/supabase/server';
import { TableBooking } from '@/types/bookingTypes';
// import { revalidatePath, revalidateTag } from 'next/cache';

export const fetchBookingsAction = async () => {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch bookings directly from the bookings table
    // We need to ensuring we only get bookings for properties owned by the user
    // The RLS policy on 'bookings' should ideally handle this if it checks property ownership
    // However, if RLS relies on property ownership, we might need a join or careful policy.
    // Assuming RLS allows users to see bookings for their properties.

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(
        `
        *,
        property:properties!property_id (
          title,
          location
        ),
        tasks (
          id,
          type,
          status,
          priority,
          team_member_id,
          team_member:team_members!team_member_id (
            first_name,
            last_name
          ),
          scheduled_date
        )
        `
      )
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }

    // Transform data to match TableBooking interface if necessary
    // The query above returns structure compatible with TableBooking (mostly)
    // We might need to map some fields if exact names don't match or for computed fields.
    // Based on the types:
    // guest_name, start_date, end_date, platform, status are in bookings table.
    // property.title is fetched.
// console.log('Bookings: ',bookings[1].tasks)

    return (bookings as unknown as TableBooking[]) || [];
  } catch (error) {
    console.error('Unexpected error fetching bookings:', error);
    return [];
  }
};

export const updateBookingAction = async (data: any) => {
  try {
    const supabase = await createClient();
    const { bookingId, ...updates } = data;
    console.log('Booking Data: ',data)
    const { error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', bookingId);

    if (error) {
      console.error('Error updating booking:', error);
      return { success: false, error: error.message };
    }

    // revalidatePath('/dashboard/bookings');
    // revalidateTag('bookings')
    return { success: true };
  } catch (error) {
    console.error('Unexpected error updating booking:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};
