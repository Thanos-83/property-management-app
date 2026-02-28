'use server';

import { CalendarData, CalendarEvent } from '@/types/bookingTypes';
import { createClient } from '../utils/supabase/server';
import detectBookingConflicts from '../utils/bookings/detectBookingConflicts';

// Fetch calendar data by platform

export const fetchCalendarDataAction = async ({
  platform = 'All',
  property,
}: {
  platform: string;
  property: string;
}): Promise<CalendarData> => {
  try {
    const supabase = await createClient();

    // Auth: get the user from supabase session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: 'Unauthorized', status: 401 };
    }

    const propertiesQuery = supabase.from('properties').select('*');

    const { data: properties, error: propertiesError } = await propertiesQuery;

    let firstProperty;
    if (!propertiesError) {
      // console.log('Properties: ', properties);
      firstProperty = properties[0].id;
    }

    let query = supabase
      .from('bookings')
      .select(
        `
      *,
      properties!inner (
        id,
        title,
        owner_id
      ),
      property_icals (
        platform
      )
    `
      )
      .eq('properties.owner_id', user.id)
      .neq('status', 'cancelled')

    if (platform !== 'All') {
      query = query.eq('platform', platform);
    }

    if (property) {
      query = query.eq('property_id', property);
    } else {
      query = query.eq('property_id', firstProperty);
    }

    const { data: bookings, error: bookingsError } = await query;

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return { error: bookingsError.message, status: 500 };
    }

    // Transform bookings to calendar events
    const calendarEvents: CalendarEvent[] = (bookings || []).map(
      (booking: {
        id: string;
        start_date: string;
        end_date: string;
        property_id: string;
        platform: string;
        guest_name?: string;
        booking_uid: string;
        ical_source_id: string;
        properties: { title: string };
      }) => ({
        id: booking.id,
        title: `Reserved - ${booking.properties.title}`,
        start: new Date(booking.start_date),
        end: new Date(booking.end_date),
        type: 'booking',
        resource: {
          propertyId: booking.property_id,
          propertyName: booking.properties.title,
          platform: booking.platform,
          guestName: booking.guest_name,
          bookingUid: booking.booking_uid,
          icalSourceId: booking.ical_source_id,
          originalData: booking,
        },
      })
    );

    // Fetch Tasks
    let tasksQuery = supabase
      .from('tasks')
      .select(
        `
        *,
        property:properties!property_id (
          title
        ),
        booking:bookings!booking_id (
          start_date,
          end_date,
          platform,
          guest_name
        ),
        taskTodos:task_list_item!task_list_item_task_id_fkey (
          description,
          is_completed,
          sort_order,
          completed_by_member,
          completed_datetime,
          id
        ),
        teamMember:team_members!team_member_id(
          first_name,
          last_name
        ),
        attachments:task_attachments(
          file_url,
          file_name,
          file_type,
          uploaded_by,
          id
        ),
        task_activity!task_id (
          id,
          activity_type,
          content,
          created_at,
          user_id
        )

      `
      )
      .eq('assigner_id', user.id);

    if (property) {
      tasksQuery = tasksQuery.eq('property_id', property);
    } else {
       // logic for first property if needed, or fetch all. 
       // The original code filtered bookings by firstProperty if no property passed.
       // We should arguably do the same for tasks to match the view context.
       tasksQuery = tasksQuery.eq('property_id', firstProperty);
    }

    const { data: tasks, error: tasksError } = await tasksQuery;
    
    if (tasksError) {
      console.error('Error fetching tasks for calendar:', tasksError);
      // We could return error, or just log and continue with bookings only. 
      // Let's log and continue to avoid breaking the whole calendar.
    }

  

    const taskEvents: CalendarEvent[] = (tasks || []).map((task) => ({
      id: task.id,
      title: task.title || task.type, // Use title or type
      start: new Date(task.scheduled_date),
      end: new Date(task.scheduled_date), // Tasks are point-in-time
      type: 'task',
      status: task.status,
      resource: {
        propertyId: task.property_id,
        propertyName: task.property?.title || 'Unknown Property',
        taskType: task.type,
        originalData: task,
      },
    }));

    const allEvents = [...calendarEvents, ...taskEvents];
    // Detect conflicts (only for bookings for now, checks overlaps)
    const conflicts = detectBookingConflicts(calendarEvents);
    const bookingEvents: CalendarData = {
      events: allEvents,
      conflicts,
      totalBookings: calendarEvents.length,
      conflictCount: conflicts.reduce(
        (sum, conflict) => sum + conflict.conflicts.length,
        0
      ),
    };
    // console.log('Calendar DATA in Server Action: ', bookingEvents);
    return bookingEvents;
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    return { error: 'Error fetching calendar data', status: 500 };
  }
};

// Fetch  properties
export const fetchCalendarDataFilterOptionsAction = async () => {
  const supabase = await createClient();

  const query = supabase.from('properties').select(`
    id,
    title,
    ical_urls:property_icals(
    platform,
    ical_url
    )
    `);

  const { data: filterOptions, error: filterOptionsError } = await query;

  // console.log('filterOptions Data: ', filterOptions);
  if (filterOptionsError) {
    console.log('Fetch filter options Error: ', filterOptionsError);
  }
  // console.log('filterOptions: ', propertyData);
  return filterOptions ?? [];
};
