import React, { Suspense } from 'react';
import DashboardPageWrapper from '@/components/DashboardPageWrapper';
import EnhancedCalendar from '@/components/calendar/EnhancedCalendar';
import LoadingSpinner from '@/components/LoadingSpinner';
// import { fetchCookies } from '@/lib/utils/cookies/fetchCookies';

// Fetch calendar data
const fetchCalendarData = async () => {
  // const cookiesList = await fetchCookies();
  // console.log('Cookies: ', cookiesList);
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const cookiesList = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');

  try {
    const response = await fetch('http://localhost:3000/api/calendar', {
      headers: {
        Cookie: cookiesList,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch calendar data');
    }
    console.log('Reponse fetching calendar data: ', response);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    return error;
  }
};

function Calendar() {
  const bookingData = fetchCalendarData();
  console.log('Calendar Data on the server Page: ', bookingData);

  return (
    <DashboardPageWrapper>
      <div className='flex-1 overflow-y-auto'>
        {/* <div className='mb-4 bg-white border-b-2 border-b-neutral/20'>
          <div className='p-6'>
            <h1 className='text-2xl font-bold'>Calendar</h1>
            <p className='text-gray-600 mt-1'>
              View and manage all your property bookings in one place
            </p>
          </div>
        </div> */}
        <div className='px-4 pb-4'>
          <Suspense fallback={<LoadingSpinner />}>
            <EnhancedCalendar
              // events={bookingData.events}
              // conflicts={bookingData.conflicts}
              // totalBookings={bookingData.totalBookings}
              // conflictCount={bookingData.conflictCount}
              bookingData={bookingData}
            />
          </Suspense>
        </div>
      </div>
    </DashboardPageWrapper>
  );
}

export default Calendar;
