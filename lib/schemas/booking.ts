import { z } from 'zod';

export const bookingSchema = z.object({
  bookingId: z.string(),
  guest_name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  guest_email: z.string().email('Invalid email address').optional().or(z.literal('')),
  guest_phone: z.string().optional(),
  adults: z.coerce.number().min(1, 'At least 1 adult is required'),
  children: z.coerce.number().min(0).default(0),
  total_payout: z.coerce.number().min(0, 'Payout must be positive').default(0),
  booking_notes: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  property_id: z.string().optional(),
  status: z.string().optional()
});

export type BookingSchemaType = z.infer<typeof bookingSchema>;
