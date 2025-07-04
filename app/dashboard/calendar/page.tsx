import React, { Suspense } from 'react';
import DashboardPageWrapper from '@/components/DashboardPageWrapper';
import LoadingSpinner from '@/components/LoadingSpinner';
import { PropertyFilter } from '@/components/calendar/PropertyFilter';
import { fetchCalendarDataAction } from '@/lib/actions/calendarActions';
import EnhancedCalendar from '@/components/calendar/EnhancedCalendar';
import { CalendarData } from '@/types/bookingTypes';

async function Calendar() {
  const bookingData: Promise<CalendarData> = fetchCalendarDataAction();

  return (
    <DashboardPageWrapper>
      <div className='flex-1 overflow-y-auto'>
        <div className='p-4 flex items-center gap-4'>
          <Suspense>
            <PropertyFilter bookingData={bookingData} />
          </Suspense>
        </div>
        <div className='px-4 pb-4'>
          <Suspense fallback={<LoadingSpinner />}>
            <EnhancedCalendar bookingData={bookingData} />
          </Suspense>
        </div>
      </div>
    </DashboardPageWrapper>
  );
}

export default Calendar;
