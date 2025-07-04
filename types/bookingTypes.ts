export interface BookingEvent {
  id: string;
  property_id: string;
  ical_source_id: string;
  booking_uid: string;
  platform: 'Airbnb' | 'Booking' | 'Vrbo' | 'Expedia' | string;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  guest_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    propertyId: string;
    propertyName: string;
    platform: string;
    bookingUid: string;
    icalSourceId: string;
    guestName?: string;
  };
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
