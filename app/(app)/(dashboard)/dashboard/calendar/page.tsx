import React, { Suspense } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';

import {
  fetchCalendarDataAction,
  fetchCalendarDataFilterOptionsAction,
} from '@/lib/actions/calendarActions';
import EnhancedCalendar from '@/components/calendar/EnhancedCalendar';
// import { CalendarData } from '@/types/bookingTypes';
import { SearchParams } from 'nuqs';
import FilterCalendarData from '@/components/calendar/FilterCalendarData';
import { fetchTaskPrioritiesAction, fetchTaskStatusDataAction } from '@/lib/actions/taskActions';
import { getTaskMembersAction } from '@/lib/actions/taskMemberActions';
import { createClient } from '@/lib/utils/supabase/server';

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
  const taskStatusDataPromise = fetchTaskStatusDataAction();
  const taskPrioritiesDataPromise = fetchTaskPrioritiesAction();
  const taskMembersDataPromise = getTaskMembersAction();

  const [taskStatusData, taskPrioritiesData, taskMembersData] = await Promise.all([
    taskStatusDataPromise,
    taskPrioritiesDataPromise,
    taskMembersDataPromise,
  ]);

  const filterOptionsData = await fetchCalendarDataFilterOptionsAction();
console.log('Filter options data: ', filterOptionsData);

  const supabase = await createClient();
  const user = await supabase.auth.getUser();

  return (
    <div className='group flex-1 overflow-y-auto'>
      <div className='p-4 flex items-center gap-4'>
        {/* <Suspense> */}
        {/* <FilterCalendarData filterOptionsData={filterOptionsData} /> */}
        {/* </Suspense> */}
      </div>
      <div className='px-4 pb-4'>
        <Suspense fallback={<LoadingSpinner />}>
          <EnhancedCalendar 
            bookingData={bookingData} 
            properties={filterOptionsData || []} 
            taskStatusData={taskStatusData?.data || []} 
            taskPrioritiesData={taskPrioritiesData?.data || []} 
            taskMembersData={taskMembersData?.members || []} 
            currentUserId={user.data.user?.id || ''} 
            filterOptionsData={filterOptionsData || []} 
            />
        </Suspense>
      </div>
    </div>
  );
}

export default Calendar;
