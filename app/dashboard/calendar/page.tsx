import React, { Suspense } from 'react';
import DashboardPageWrapper from '@/components/DashboardPageWrapper';
import LoadingSpinner from '@/components/LoadingSpinner';

import {
  fetchCalendarDataAction,
  fetchCalendarDataFilterOptionsAction,
} from '@/lib/actions/calendarActions';
import EnhancedCalendar from '@/components/calendar/EnhancedCalendar';
// import { CalendarData } from '@/types/bookingTypes';
import { SearchParams } from 'nuqs';
import FilterCalendarData from '@/components/calendar/FilterCalendarData';

async function Calendar({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  console.log('Search Params in Calendar Server Page: ', params);

  const { platform = 'All', property = '' } = params as {
    platform?: string;
    property?: string;
  };

  const bookingData = fetchCalendarDataAction({ platform, property });

  const filterOptionsData = await fetchCalendarDataFilterOptionsAction();

  return (
    <DashboardPageWrapper>
      <div className='group flex-1 overflow-y-auto'>
        <div className='p-4 flex items-center gap-4'>
          {/* <Suspense> */}
          <FilterCalendarData filterOptionsData={filterOptionsData} />
          {/* </Suspense> */}
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
