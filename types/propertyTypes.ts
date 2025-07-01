export type PropertyTypes = {
  id: string;
  title: string;
  description: string;
  location: string;
  rooms: number;
  ical_url: string;
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

export type PropertyTypesApi = {
  company_id: string | null;
  created_at: string;
  description: string;
  // ical_url: string;
  id: string;
  location: string;
  owner_id: string;
  rooms: number;
  title: string;
  updated_at: string;
  property_icals: [PropertyIcalUrls];
};

// export type
