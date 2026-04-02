import { MessageStatus } from './index';

export interface Conversation {
  id: string; // The unique identifier for the thread (Usually the booking_id)
  bookingId?: string; // The actual database UUID of the booking (nullable for inquiries)
  guestEmail: string; // The contact info to display
  guestName: string; // The name to display in the UI
  latestMessage: string; // The preview text (e.g., "You: Sounds good!")
  lastMessageAt: string; // Timestamp for sorting the Left Pane
  status?: MessageStatus; // 'received', 'delivered', etc.
  channel?: string; // 'email', 'sms', 'airbnb' (Great for UI icons)
  isUnread?: boolean; // To show a blue dot in the UI if needed
  propertyTitle?: string;
}

export interface Booking {
  id: string; // UUID
  guest_name: string | null;

  // Dates are now pure YYYY-MM-DD strings thanks to our refactor!
  start_date: string;
  end_date: string;

  total_payout: number | null;
  guest_email: string | null;
  guest_phone: string | null;
  guest_count: number | null;
  adults: number | null;
  children: number | null;

  booking_uid: string; // The platform's confirmation code
  property_id: string; // UUID linking to the properties table

  // You can strictly type platforms if you want to lock it down
  platform:
    | 'Airbnb'
    | 'Booking.com'
    | 'Vrbo'
    | 'Expedia'
    | 'Unknown'
    | 'Other'
    | string;

  // Times are pure HH:mm:ss or HH:mm strings
  custom_check_in_time: string | null;
  custom_check_out_time: string | null;

  // You can also strictly type the status
  status: 'confirmed' | 'pending' | 'cancelled' | string;

  booking_notes: string | null;
}
