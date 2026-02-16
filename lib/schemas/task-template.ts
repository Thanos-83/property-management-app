import * as z from 'zod';

export const taskTemplateSchema = z.object({
  name: z.string().min(3, 'Template name must be at least 3 characters'),
  task_type: z.enum(['Cleaning', 'Maintenance', 'Inspection', 'Meet & Greet'], {
    errorMap: () => ({ message: 'Please select a task type' }),
  }),
  priority: z.string({
    errorMap: () => ({ message: 'Please select a priority' }),
  }).min(1, 'Please select a priority'),
  description_notes: z.string().optional(),
  team_member_id: z.string().min(1, 'Please select a team member'),
  offset_minutes: z.coerce.number().min(0, 'Offset must be 0 or greater'),
  checklist: z.array(
    z.object({
      description: z.string().min(1, 'Checklist item cannot be empty'),
      order: z.number().int().optional(),
    })
  ).min(1, 'At least one checklist item is required'),
  property_ids: z.array(z.string(), {
    invalid_type_error: 'Please select at least one property',
  }).min(1, 'Please select at least one property'),
});


export type TaskTemplateSchemaType = z.infer<typeof taskTemplateSchema>;
