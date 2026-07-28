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
