import { DetailedTask } from './taskTypes';

export interface BookingEvent {
  id: string;
  property_id: string;
  ical_source_id: string;
  booking_uid: string;
  platform?: 'Airbnb' | 'Booking' | 'Vrbo' | 'Expedia' | string;
  start_date: string; // yyyy-mm-dd format
  end_date: string; // yyyy-mm-dd format
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  adults?: number;
  children?: number;
  total_payout?: number;
  booking_notes?: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | string;
  created_at: string;
  updated_at: string;
  properties?: { id: string; title: string; owner_id: string };
  property_icals?: { platform: string };
  custom_check_in_time?: string | undefined; // hh:mm format
  custom_check_out_time?: string | undefined; // hh:mm format
}

export interface ParsedIcalEvent {
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  description?: string;
  location?: string;
}

export interface SyncResult {
  success: boolean;
  propertyId: string;
  icalSourceId: string;
  newBookings: number;
  updatedBookings: number;
  errors?: string[];
}

export interface ConflictDetection {
  propertyId: string;
  propertyName: string;
  conflicts: {
    booking1: {
      platform: string;
      dates: string;
      guestName?: string;
    };
    booking2: {
      platform: string;
      dates: string;
      guestName?: string;
    };
    overlapDays: number;
  }[];
}

// 1. Create a Base Event with the shared properties
export interface BaseCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status?: string;
}

// 2. Create the Booking-specific Event
export interface BookingCalendarEvent extends BaseCalendarEvent {
  type: 'booking'; // The discriminator
  resource: {
    propertyId: string;
    propertyName: string;
    platform?: string;
    bookingUid?: string;
    icalSourceId?: string;
    guestName?: string;
    // Store the raw booking data here!
    originalData: BookingEvent & { properties?: { title: string } };
  };
}

// 3. Create the Task-specific Event
export interface TaskCalendarEvent extends BaseCalendarEvent {
  type: 'task'; // The discriminator
  resource: {
    propertyId: string;
    propertyName: string;
    taskType?: string;
    // THIS IS THE MAGIC LINK: It expects our perfect DetailedTask!
    originalData: DetailedTask;
  };
}

// 4. Combine them into the CalendarEvent type
export type CalendarEvent = BookingCalendarEvent | TaskCalendarEvent;

export type CalendarData =
  | {
      events?: CalendarEvent[];
      conflicts?: ConflictDetection[] | [];
      totalBookings?: number;
      conflictCount?: number;
    }
  | {
      error?: string;
      status?: number;
    };

export interface TableBooking extends BookingEvent {
  property: {
    title: string;
    location?: string;
  };
  tasks?: DetailedTask[];
}
