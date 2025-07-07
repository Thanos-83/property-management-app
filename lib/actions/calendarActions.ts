import {
  CalendarData,
  CalendarEvent,
  BookingEvent,
} from '@/types/bookingTypes';
import { createClient } from '../utils/supabase/server';
import detectBookingConflicts from '../utils/bookings/detectBookingConflicts';
import { PropertyTypesApi } from '@/types/propertyTypes';

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

    console.log('Search Params in Server Action: ', platform);
    console.log('Search Params in Server Action: ', property);

    // Auth: get the user from supabase session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: 'Unauthorized', status: 401 };
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
      .eq('property_id', property);

    if (platform !== 'All') {
      query = query.eq('platform', platform);
    }

    // if (property) {
    //   query = query.eq('property_id', property);
    // }

    const { data: bookings, error: bookingsError } = await query;

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
    // console.log('Calendar DATA in Server Action: ', bookingEvents);
    return bookingEvents;
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    return { error: 'Error fetching calendar data', status: 500 };
  }
};

// Fetch property available platforms
export const fetchPropertyPlatformsAction = async (property: string) => {
  const supabase = await createClient();

  console.log('Property ID: ', property);
  // console.log('Platform: ', platform);
  // Auth: get the user from supabase session
  //   const {
  //     data: { user },
  //     error: userError,
  //   } = await supabase.auth.getUser();

  //   if (userError || !user) {
  //     return { error: 'Unauthorized', status: 401 };
  //   }

  let query = supabase.from('property_icals').select('*');

  if (property) {
    query = query.eq('property_id', property);
  }
  const { data: bookings, error: bookingsError } = await query;

  //   console.log('Bookings Data: ', bookings);

  if (bookingsError) {
  }
  const platforms = bookings
    ? Array.from(
        new Set(bookings.map((booking: BookingEvent) => booking.platform))
      )
    : [];

  const extendedPlatforms = platforms.toSpliced(0, 0, 'All');
  // console.log('Property Platforms: ', platforms);
  // console.log('All Property Platforms: ', extendedPlatforms);
  return extendedPlatforms;
};

// Fetch  properties
export const fetchPropertiesDataAction = async () => {
  const supabase = await createClient();

  // Auth: get the user from supabase session
  //   const {
  //     data: { user },
  //     error: userError,
  //   } = await supabase.auth.getUser();

  //   if (userError || !user) {
  //     return { error: 'Unauthorized', status: 401 };
  //   }

  const query = supabase.from('properties').select('*');

  const { data: properties, error: propertiesError } = await query;

  // console.log('Properties Data: ', properties);

  if (propertiesError) {
  }
  const propertyData = properties?.map((property: PropertyTypesApi) => {
    return {
      propertyId: property.id,
      propertyName: property.title,
    };
  });

  // console.log('Properties: ', propertyData);
  return propertyData;
};
