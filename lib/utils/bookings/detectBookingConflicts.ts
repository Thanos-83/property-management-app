import { CalendarEvent, ConflictDetection } from '@/types/bookingTypes';
import { IcalParser } from '@/lib/services/icalParser';

/**
 * Detect booking conflicts across properties
 */
export default function detectBookingConflicts(
  events: CalendarEvent[]
): ConflictDetection[] {
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
