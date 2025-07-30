import { z } from 'zod';

export const taskSchema = z.object({
  id: z.string().uuid().optional(),
  property_id: z.string().uuid(),
  booking_id: z.string().uuid().optional(),
  assignee_id: z.string().uuid().optional(),
  type: z.string().min(1, 'Task type is required'),
  status: z.string().optional(),
  scheduled_date: z.string().min(1, 'Scheduled date is required'),
  notes: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type TaskSchemaType = z.infer<typeof taskSchema>;
