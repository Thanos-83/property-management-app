import React, { Suspense } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';

import {
  fetchCalendarDataAction,
  fetchCalendarDataFilterOptionsAction,
} from '@/lib/actions/calendarActions';
import EnhancedCalendar from '@/components/calendar/EnhancedCalendar';
// import { CalendarData } from '@/types/bookingTypes';
import { SearchParams } from 'nuqs';
// import FilterCalendarData from '@/components/calendar/FilterCalendarData';
import {
  fetchTaskPrioritiesAction,
  fetchTaskStatusDataAction,
} from '@/lib/actions/taskActions';
import { getTaskMembersAction } from '@/lib/actions/taskMemberActions';
import { createClient } from '@/lib/utils/supabase/server';

async function Calendar({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  // console.log('Search Params in Calendar Server Page: ', params);

  const { platform = 'All', property = '' } = params as {
    platform?: string;
    property?: string;
  };

  const bookingData = fetchCalendarDataAction({ platform, property });
  const taskStatusDataPromise = fetchTaskStatusDataAction();
  const taskPrioritiesDataPromise = fetchTaskPrioritiesAction();
  const taskMembersDataPromise = getTaskMembersAction();

  const [taskStatusData, taskPrioritiesData, taskMembersData] =
    await Promise.all([
      taskStatusDataPromise,
      taskPrioritiesDataPromise,
      taskMembersDataPromise,
    ]);

  const filterOptionsData = await fetchCalendarDataFilterOptionsAction();

  const supabase = await createClient();
  const user = await supabase.auth.getUser();

  // console.log('User: ', user);
  // console.log('User user_metadata: ', user.data.user?.user_metadata);
  // console.log('User app_metadata: ', user.data.user?.app_metadata);

  console.log('Taks Members Data in Calendar page: ', taskMembersData);

  const teamMembers = taskMembersData.members.map((member) => ({
    id: member.id,
    name: member.first_name + ' ' + member.last_name,
  }));
  const currentUserInfo = {
    id: user.data.user?.id,
    // email: user.data.user?.email,
    // first_name: user.data.user?.user_metadata.first_name,
    // last_name: user.data.user?.user_metadata.last_name,
    full_name: user.data.user?.user_metadata.full_name,
    avatar: user.data.user?.user_metadata.avatar_url || '',
    // role: user.data.user?.app_metadata.role || '',
  };

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
            // taskMembersData={taskMembersData?.members || []}
            taskMembersData={teamMembers}
            currentUserId={user.data.user?.id || ''}
            currentUserInfo={currentUserInfo}
            filterOptionsData={filterOptionsData || []}
          />
        </Suspense>
      </div>
    </div>
  );
}

export default Calendar;
