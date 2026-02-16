import React from 'react';
import { fetchBookingsAction } from '@/lib/actions/bookingActions';
import BookingsTable from '@/components/bookings/BookingsTable';
import { TableBooking } from '@/types/bookingTypes';

export default async function BookingsPage() {
  const bookingsResult = await fetchBookingsAction();
  const bookings = Array.isArray(bookingsResult)
    ? (bookingsResult as TableBooking[])
    : [];

  return (
    <div className='group flex-1 overflow-y-auto p-4'>
      <h1 className='text-2xl font-bold mb-4'>Bookings</h1>
      <BookingsTable data={bookings} />
    </div>
  );
}
