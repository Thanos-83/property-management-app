export type TableInvoice = {
  id: string;
  status: 'draft' | 'ready' | 'transmitted' | 'failed';
  total_gross_amount: number;
  client_name: string;
  created_at: string;
  bookings: {
    id: string;
    booking_uid: string;
    start_date: string;
    check_out: string;
    guest_name: string;
    properties: {
      id: string;
      title: string;
      owner_id: string;
    };
  };
};
