import * as z from 'zod';

export const memberSignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must me at least 6 characters long'),
});

export type MemberSigninSchemaType = z.infer<typeof memberSignInSchema>;
