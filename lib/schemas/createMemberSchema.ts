import * as z from 'zod';
import { isValidPhoneNumber } from 'react-phone-number-input';

export const createMemberSchema = z.object({
  firstName: z.string().min(3),
  lastName: z.string().min(3),
  mobilePhone: z
    .string()
    .refine(isValidPhoneNumber, { message: 'Invalid phone number' }),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email'),
  password: z.string().min(6, 'Password must me at least 6 characters long'),
});

export type CreateMemberSchemaType = z.infer<typeof createMemberSchema>;
