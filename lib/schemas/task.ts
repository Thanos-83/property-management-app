import { z } from 'zod';

// Define subtask schema
export const subtaskSchema = z.object({
  id: z.string(),
  description: z.string().min(5, 'Subtask content is required'),
  // order: z.number().optional(),
  // completed: z.boolean().optional().default(false),
});

export type SubtaskType = z.infer<typeof subtaskSchema>;

export const taskSchema = z.object({
  id: z.string().uuid().optional(),
  property_id: z.string().uuid(),
  booking_id: z.string().uuid().optional(),
  team_member_id: z.string().uuid().optional().nullable(),
  assigner_id: z.string().uuid(),
  type: z.string().min(1, 'Task type is required'),
  status: z.string().optional(),
  priority: z.number().int(),
  scheduled_date: z.string().min(1, 'Scheduled date is required'),
  notes: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  subtasks: z.array(subtaskSchema).min(0),
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

// Task Details Sheet Schema

export const taskDetailsSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required').optional().or(z.literal('')),
  property_id: z.string().min(1, 'Property is required'),
  booking_id: z.string().nullable().optional(),
  team_member_id: z.string().nullable(),
  status: z.string().min(1, 'Status is required'),
  priority: z.string().min(1, 'Priority is required'),
  scheduled_date: z.date({
    required_error: 'Scheduled date is required',
    invalid_type_error: "That's not a valid date",
  }),
  notes: z.string().nullable().optional(),
  taskTodos: z.array(
    z.object({
      id: z.string(),
      description: z.string().min(1, 'Subtask content is required'),
      is_completed: z.boolean(),
      sort_order: z.number(),
      completed_by_member: z.string().nullable().optional(),
      completed_datetime: z.string().nullable().optional(),
    }),
  ),
  newAttachments: z.array(
    z.object({
      file_url: z.string(),
      file_name: z.string(),
      file_type: z.string(),
    }),
  ),
  attachmentsToRemove: z.array(z.string()),
});

// Infer the TypeScript type from the Zod Schema!
export type TaskDetailsSchemaType = z.infer<typeof taskDetailsSchema>;
