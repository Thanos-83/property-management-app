import React, { Suspense } from 'react';
import DashboardPageWrapper from '@/components/DashboardPageWrapper';
import LoadingSpinner from '@/components/LoadingSpinner';
import { PlatformFilter } from '@/components/calendar/PlatformFilter';
import { PropertyFilter } from '@/components/calendar/PropertyFilter';

import {
  fetchCalendarDataAction,
  fetchPropertiesDataAction,
  fetchPropertyPlatformsAction,
} from '@/lib/actions/calendarActions';
import EnhancedCalendar from '@/components/calendar/EnhancedCalendar';
import { CalendarData } from '@/types/bookingTypes';
import { SearchParams } from 'nuqs';

async function Calendar({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  console.log('Search Params in Calendar Server Page: ', params);

  const bookingData = fetchCalendarDataAction(params);

  const propertyData = fetchPropertiesDataAction();

  const propertyPlatforms = fetchPropertyPlatformsAction(params.property);

  return (
    <DashboardPageWrapper>
      <div className='flex-1 overflow-y-auto'>
        <div className='p-4 flex items-center gap-4'>
          <Suspense fallback={<p>Loading....</p>}>
            <PlatformFilter propertyPlatforms={propertyPlatforms} />
          </Suspense>

          <Suspense>
            <PropertyFilter propertyData={propertyData} />
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
