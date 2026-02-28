import React from 'react';
import { fetchBookingsAction } from '@/lib/actions/bookingActions';
import BookingsTable from '@/components/bookings/BookingsTable';
import { TableBooking } from '@/types/bookingTypes';
import { getPropertiesDataAction } from '@/lib/actions/propertiesActions';
import { getTaskMembersAction } from '@/lib/actions/taskMemberActions';
import { fetchTaskPrioritiesAction, fetchTaskStatusDataAction } from '@/lib/actions/taskActions';
import { createClient } from '@/lib/utils/supabase/server';

export default async function BookingsPage() {
  /* Fetch auxiliary data for AddTaskModal to avoid N+1 requests */
  //  const taskStatusDataPromise = fetchTaskStatusDataAction()s
  const [bookingsResult, propertiesResult, membersResult, prioritiesResult, taskStatusResult] =
    await Promise.all([
      fetchBookingsAction(),
      getPropertiesDataAction(),
      getTaskMembersAction(),
      fetchTaskPrioritiesAction(),
      fetchTaskStatusDataAction(),
    ]);

  const bookings = Array.isArray(bookingsResult)
    ? (bookingsResult as TableBooking[])
    : [];

  const properties =
    propertiesResult.status === 200 && propertiesResult.properties
      ? propertiesResult.properties
      : [];

  const members =
    membersResult.status === 200 && membersResult.members
      ? membersResult.members.map((m) => ({
          id: m.id,
          name: m.first_name + ' ' + m.last_name,
        }))
      : [];

  const priorities =
    !prioritiesResult.error && prioritiesResult.data
      ? prioritiesResult.data
      : [];

  const bookinsProperties = properties.map((property) => ({
        id: property.id,
        title: property.title,
        icalUrls: property.property_icals.map((ical: any) => {
          return {
            url: ical.ical_url,
            platform: ical.platform,
          };
        }),
      }));

    const supabase = await createClient();
    const user = await supabase.auth.getUser();
  return (
    <div className='group flex-1 overflow-y-auto p-4'>
      <h1 className='text-2xl font-bold mb-4'>Bookings</h1>
      <BookingsTable
        data={bookings}
        properties={bookinsProperties}
        members={members}
        priorities={priorities}
        taskStatus={taskStatusResult.data || []}
        currentUserId={user.data.user?.id || ''} 
      />
    </div>
  );
}
