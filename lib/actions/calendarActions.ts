'use server';

import { createClient } from '../utils/supabase/server';
import { TASK_DETAILS_QUERY } from '../constants/queries';
import {
  CalendarData,
  CalendarEvent,
  BookingCalendarEvent,
  TaskCalendarEvent,
} from '../../types/bookingTypes';
import { DetailedTask } from '../../types/taskTypes';
import detectBookingConflicts from '../utils/bookings/detectBookingConflicts';

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
    if (!propertiesError && properties && properties.length > 0) {
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
      `,
      )
      .eq('properties.owner_id', user.id)
      .neq('status', 'cancelled');

    if (platform !== 'All') {
      query = query.eq('platform', platform);
    }

    if (property) {
      query = query.eq('property_id', property);
    } else if (firstProperty) {
      query = query.eq('property_id', firstProperty);
    }

    const { data: bookings, error: bookingsError } = await query;

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return { error: bookingsError.message, status: 500 };
    }

    // Transform bookings to calendar events
    const calendarEvents: BookingCalendarEvent[] = (bookings || []).map(
      (booking) => ({
        id: booking.id,
        title: `Reserved - ${booking.properties?.title || 'Unknown'}`,
        start: new Date(booking.start_date),
        end: new Date(booking.end_date),
        type: 'booking',
        resource: {
          propertyId: booking.property_id,
          propertyName: booking.properties?.title || 'Unknown',
          platform: booking.platform,
          guestName: booking.guest_name,
          bookingUid: booking.booking_uid,
          icalSourceId: booking.ical_source_id,
          originalData: booking,
        },
      }),
    );

    // Fetch Tasks using the Single Source of Truth Query
    let tasksQuery = supabase
      .from('tasks')
      .select(TASK_DETAILS_QUERY)
      .eq('assigner_id', user.id);

    if (property) {
      tasksQuery = tasksQuery.eq('property_id', property);
    } else if (firstProperty) {
      tasksQuery = tasksQuery.eq('property_id', firstProperty);
    }

    const { data: tasks, error: tasksError } = await tasksQuery;

    if (tasksError) {
      console.error('Error fetching tasks for calendar:', tasksError);
      // Log the error but continue to ensure bookings still render on the calendar
    }

    // Transform tasks to calendar events
    const taskEvents: TaskCalendarEvent[] = (tasks || []).map((task) => {
      // Enforce the DetailedTask type to guarantee safety
      const typedTask = task as DetailedTask;

      return {
        id: typedTask.id,
        title: typedTask.title || typedTask.type || 'Task',
        start: new Date(typedTask.scheduled_date),
        end: new Date(typedTask.scheduled_date), // Tasks are point-in-time
        type: 'task', // TypeScript recognizes this as TaskCalendarEvent
        status: typedTask.status,
        resource: {
          propertyId: typedTask.property_id || '',
          propertyName: typedTask.property?.title || 'Unknown Property',
          taskType: typedTask.type,
          originalData: typedTask, // Safely stores our DetailedTask
        },
      };
    });

    const allEvents: CalendarEvent[] = [...calendarEvents, ...taskEvents];

    // Detect conflicts (only for bookings for now, checks overlaps)
    const conflicts = detectBookingConflicts(calendarEvents);

    const bookingEvents: CalendarData = {
      events: allEvents,
      conflicts,
      totalBookings: calendarEvents.length,
      conflictCount: conflicts.reduce(
        (sum, conflict) => sum + conflict.conflicts.length,
        0,
      ),
    };

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

  if (filterOptionsError) {
    console.log('Fetch filter options Error: ', filterOptionsError);
  }
  return filterOptions ?? [];
};
