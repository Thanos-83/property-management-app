import { NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';
import { CalendarEvent, ConflictDetection } from '@/types/bookingTypes';
import { IcalParser } from '@/lib/services/icalParser';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('Iam in the calendar api route 1');
    // Get all bookings for user's properties
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
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      );
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
    const conflicts = detectConflicts(calendarEvents);
    // console.log('Calendar DATA in API ROUTE: ', calendarEvents);
    return NextResponse.json({
      events: calendarEvents,
      conflicts,
      totalBookings: calendarEvents.length,
      conflictCount: conflicts.reduce(
        (sum, conflict) => sum + conflict.conflicts.length,
        0
      ),
    });
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Detect booking conflicts across properties
 */
function detectConflicts(events: CalendarEvent[]): ConflictDetection[] {
  const conflictsByProperty: { [propertyId: string]: ConflictDetection } = {};

  // Group events by property
  const eventsByProperty = events.reduce((acc, event) => {
    const propertyId = event.resource.propertyId;
    if (!acc[propertyId]) {
      acc[propertyId] = [];
    }
    acc[propertyId].push(event);
    return acc;
  }, {} as { [propertyId: string]: CalendarEvent[] });

  // Check for conflicts within each property
  Object.entries(eventsByProperty).forEach(([propertyId, propertyEvents]) => {
    const conflicts: ConflictDetection['conflicts'] = [];

    for (let i = 0; i < propertyEvents.length; i++) {
      for (let j = i + 1; j < propertyEvents.length; j++) {
        const event1 = propertyEvents[i];
        const event2 = propertyEvents[j];

        // Check if dates overlap
        if (
          IcalParser.datesOverlap(
            event1.start,
            event1.end,
            event2.start,
            event2.end
          )
        ) {
          const overlapDays = IcalParser.calculateOverlapDays(
            event1.start,
            event1.end,
            event2.start,
            event2.end
          );

          conflicts.push({
            booking1: {
              platform: event1.resource.platform,
              dates: `${event1.start.toDateString()} - ${event1.end.toDateString()}`,
              guestName: event1.resource.guestName,
            },
            booking2: {
              platform: event2.resource.platform,
              dates: `${event2.start.toDateString()} - ${event2.end.toDateString()}`,
              guestName: event2.resource.guestName,
            },
            overlapDays,
          });
        }
      }
    }

    if (conflicts.length > 0) {
      conflictsByProperty[propertyId] = {
        propertyId,
        propertyName: propertyEvents[0].resource.propertyName,
        conflicts,
      };
    }
  });

  return Object.values(conflictsByProperty);
}
