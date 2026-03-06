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
