import * as z from 'zod';

export const authSignUpSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Please enter a valid name. More than 2 characters long'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email'),
  password: z.string().min(6, 'Password must me at least 6 characters long'),
});

export type AuthSignupSchemaType = z.infer<typeof authSignUpSchema>;

export const authSignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must me at least 6 characters long'),
});

export type AuthSigninSchemaType = z.infer<typeof authSignInSchema>;
