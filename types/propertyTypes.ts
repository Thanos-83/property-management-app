import { BookingEvent } from './bookingTypes';

export type PropertyTypesApi = {
  id: string;
  company_id: string | null;
  owner_id: string;
  title: string;
  description: string;
  location: string;
  rooms: number;
  created_at: string;
  updated_at: string;
  image_url: string | null;
  property_icals?: PropertyIcalUrls[];
  template_links?: PropertyTemplateLinks[];
};

export type PropertyTypesApp = {
  id: string;
  company_id: string | null;
  owner_id: string;
  title: string;
  description: string;
  location: string;
  rooms: number;
  created_at: string;
  updated_at: string;
  image_url: string | null;
  property_icals?: PropertyIcalUrls[];
  template_links?: PropertyTemplateLinks[];
};

export type PropertyIcalUrls = {
  id: string;
  status: string;
  ical_url: string;
  platform: string;
  created_at: string;
  updated_at: string;
  last_synced: string | null;
  property_id: string;
};

export type PropertyTemplateLinks = {
  id: string;
  template_id: string;
  property_id: string;
  is_active: boolean;
  offset_minutes: number;
};

export interface PropertyIcal {
  id: string;
  property_id: string;
  platform: 'Expedia' | 'Vrbo' | 'Booking' | 'Airbnb' | string;
  ical_url: string;
  status: 'active' | 'inactive' | string;
  sync_status: 'success' | 'failed' | 'pending' | string;
  last_synced_at: string | null;
  last_error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  image_url: string | null;
  rooms: number;
  default_check_in_time: string;
  default_check_out_time: string;
  owner_id: string;
  company_id: string | null;
  automation_template_id: string | null;
  property_icals: PropertyIcal[];
  created_at: string;
  updated_at: string;
}

export interface DetailedProperty extends Property {
  template_links: PropertyTemplateLinks[];
  bookings: BookingEvent[]; // Type-safe booking array!
  upcoming_bookings_count: number;
}

// Property Template Types

export interface PropertyTaskTemplate {
  id: string;
  name: string;
  task_type: string;
}

// Sync Types from the API call /api/sync

export interface SyncResultItem {
  success: boolean;
  propertyId: string;
  icalSourceId: string;
  newBookings: number;
  updatedBookings: number;
}

export interface SyncSummary {
  totalNewBookings: number;
  totalUpdatedBookings: number;
  successfulSyncs: number;
  failedSyncs: number;
  totalSyncs: number;
}

export interface BulkSyncResponse {
  success: boolean;
  results: SyncResultItem[];
  summary: SyncSummary;
}
