// lib/schemas/property.ts
import * as z from 'zod';

export const propertySchema = z.object({
  title: z.string().min(3, 'Ο τίτλος πρέπει να έχει τουλάχιστον 3 χαρακτήρες'),
  description: z.string().optional(),
  location: z.string().min(2, 'Η τοποθεσία είναι υποχρεωτική'),
  rooms: z.number().min(1, 'Πρέπει να υπάρχει τουλάχιστον 1 δωμάτιο'),
  ical_url: z.string().url('Δώσε έγκυρο URL').optional(),
});
export type PropertySchemaType = z.infer<typeof propertySchema>;

export const propertyIcalSchema = z.object({
  propertyId: z.string().uuid('Invalid property ID'),
  // platform: z.enum(['Airbnb', 'Booking', 'Vrbo', 'Expedia'], {
  //   required_error: 'Platform is required',
  // }),
  platform: z.string().nonempty('Platform is required'),
  icalUrl: z.string().url('Invalid URL').nonempty('iCal URL is required'),
});
export type PropertyIcalSchemaType = z.infer<typeof propertyIcalSchema>;
