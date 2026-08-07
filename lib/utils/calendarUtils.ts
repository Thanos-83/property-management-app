import { CalendarEvent } from '@/types/bookingTypes';
import { areIntervalsOverlapping } from 'date-fns';

/**
 * Checks if a booking event overlaps with any other booking event in the list for the same property.
 *
 * @param event The event to check for conflicts
 * @param allEvents The list of all events to check against
 * @returns boolean True if there is a conflict
 */
export const isBookingConflicting = (
  event: CalendarEvent,
  allEvents: CalendarEvent[],
): boolean => {
  if (event.type !== 'booking') return false;

  return allEvents.some((other) => {
    // 1. Must be a different event
    if (other.id === event.id) return false;

    // 2. Must be a booking
    if (other.type !== 'booking') return false;

    // 3. Must be for the same property
    if (other.resource.propertyId !== event.resource.propertyId) return false;

    // 4. Check for overlapping intervals
    // return areIntervalsOverlapping(
    //   { start: new Date(event.start), end: new Date(event.end) },
    //   { start: new Date(other.start), end: new Date(other.end) },
    //   { inclusive: false }
    // );

    const thisStart = new Date(event.resource.originalData.start_date);
    const thisEnd = new Date(event.resource.originalData.end_date);

    const otherStart = new Date(other.resource.originalData.start_date);
    const otherEnd = new Date(other.resource.originalData.end_date);

    // Check overlap with inclusive: false (Abutting dates are allowed)
    return areIntervalsOverlapping(
      { start: thisStart, end: thisEnd },
      { start: otherStart, end: otherEnd },
      { inclusive: false },
    );
  });
};

/**
 * Converts a local date to UTC by stripping the time component.
 * This ensures that when you pass a date to the calendar, it is treated as a full-day event
 * starting at 00:00 UTC, regardless of the user's local timezone offset.
 */

export const toUTC = (date: Date) => {
  if (!date) return undefined;
  // Create a new date using the UTC components of the local date
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
};
