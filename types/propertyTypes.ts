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
