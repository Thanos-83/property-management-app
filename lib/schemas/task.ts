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

export const taskMemberSchema = z.object({
  user_id: z.string().optional(),
  email: z.string().min(1, 'Email is required'),
  first_name: z.string().min(1, 'First name is required').optional(),
  last_name: z.string().min(1, 'Last name is required').optional(),
  phone: z.string().min(10, 'Mobile phone is required').optional(),
  has_portal_access: z.boolean().optional(),
  status: z.string().optional(),
  member_role: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type TaskMemberSchemaType = z.infer<typeof taskMemberSchema>;
