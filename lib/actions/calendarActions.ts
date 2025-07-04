import { CalendarData, CalendarEvent } from '@/types/bookingTypes';
import { createClient } from '../utils/supabase/server';
import detectBookingConflicts from '../utils/bookings/detectBookingConflicts';

// Fetch calendar data

export const fetchCalendarDataAction = async (): Promise<CalendarData> => {
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
    const { data: bookings, error: bookingsError } = await supabase
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
      .eq('properties.owner_id', user.id);

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return { error: 'Failed to fetch bookings', status: 500 };
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
        resource: {
          propertyId: booking.property_id,
          propertyName: booking.properties.title,
          platform: booking.platform,
          guestName: booking.guest_name,
          bookingUid: booking.booking_uid,
          icalSourceId: booking.ical_source_id,
        },
      })
    );

    // Detect conflicts
    const conflicts = detectBookingConflicts(calendarEvents);
    const bookingEvents: CalendarData = {
      events: calendarEvents,
      conflicts,
      totalBookings: calendarEvents.length,
      conflictCount: conflicts.reduce(
        (sum, conflict) => sum + conflict.conflicts.length,
        0
      ),
    };
    console.log('Calendar DATA in Server Action: ', bookingEvents);
    return bookingEvents;
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    return { error: 'Error fetching calendar data', status: 500 };
  }
};
