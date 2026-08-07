import * as z from 'zod';

// 1. FOR THE ADD PROPERTY MODAL (Simple, fast, no iCal)
export const createPropertySchema = z.object({
  title: z.string().min(3, 'Ο τίτλος πρέπει να έχει τουλάχιστον 3 χαρακτήρες'),
  description: z.string().optional(),
  location: z.string().min(2, 'Η τοποθεσία είναι υποχρεωτική'),
  rooms: z.number().min(1, 'Πρέπει να υπάρχει τουλάχιστον 1 δωμάτιο'),
});
export type CreatePropertySchemaType = z.infer<typeof createPropertySchema>;

// 2. FOR THE MANAGE PROPERTY SHEET (The Canvas doc we just built)
export const managePropertySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  rooms: z.number().min(1, 'Must have at least 1 room'),
  image_url: z.string().optional(),

  // Inline iCal Form Fields (Optional because we only validate them when clicking "Add Link")
  newPlatform: z.string().optional(),
  newIcalUrl: z
    .union([z.literal(''), z.string().url('Please enter a valid URL')])
    .optional(),
});
export type ManagePropertySchemaType = z.infer<typeof managePropertySchema>;

// 3. FOR THE ADD ICAL DIALOG
export const propertyIcalSchema = z.object({
  propertyId: z.string().uuid('Invalid property ID'),
  // platform: z.enum(['Airbnb', 'Booking', 'Vrbo', 'Expedia'], {
  //   required_error: 'Platform is required',
  // }),
  platform: z.string().nonempty('Platform is required'),
  icalUrl: z.string().url('Invalid URL').nonempty('iCal URL is required'),
});
export type PropertyIcalSchemaType = z.infer<typeof propertyIcalSchema>;

// Create a dedicated schema for updates
export const updateIcalSchema = z.object({
  icalId: z.string().uuid(),
  icalUrl: z.string().url('Must be a valid URL'),
  icalPlatform: z.string().min(1, 'Platform is required'),
  propertyId: z.string().uuid(),
});
export type UpdateIcalSchemaType = z.infer<typeof updateIcalSchema>;
