import * as z from 'zod';

export const taskTemplateSchema = z.object({
  name: z.string().min(3, 'Template name must be at least 3 characters'),

  // Changed from enum to string because task types are now dynamic UUIDs from the database
  task_type: z.string().min(1, 'Please select a task type'),

  // Optional because "Standard" priority sends an empty string/null
  priority: z.string().optional(),

  description_notes: z.string().optional(),

  // Allows the UUID of the team member OR the string "unassigned"
  team_member_id: z.string().min(1, 'Please select a team member'),

  offset_minutes: z.coerce.number().min(0, 'Offset must be 0 or greater'),

  checklist: z
    .array(
      z.object({
        id: z.string().optional(), // CRITICAL: Required for our Upsert logic to work
        description: z.string().min(1, 'Checklist item cannot be empty'),
        order: z.number().int().optional(),
      }),
    )
    .min(1, 'At least one checklist item is required'),

  // Removed .min(1) so users can create "draft" templates without applying them to properties yet
  property_ids: z.array(z.string(), {
    invalid_type_error: 'Invalid property selection',
  }),

  // Support for the new active/inactive toggle
  // Changed to optional to fix React Hook Form resolver type mismatch
  is_active: z.boolean().optional(),
});

export type TaskTemplateSchemaType = z.infer<typeof taskTemplateSchema>;
