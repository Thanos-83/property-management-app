import * as z from 'zod';

export const createMemberSchema = z.object({
  name: z.string().min(3),
});

export type CreateMemberSchemaType = z.infer<typeof createMemberSchema>;
