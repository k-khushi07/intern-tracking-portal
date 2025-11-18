import { z } from 'zod';

export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number');

export const registrationSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  contact: phoneSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  pmCode: z.string().min(4, 'PM code required'),
  duration: z.string().min(1, 'Duration required'),
  workMode: z.string().min(1, 'Work mode required')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});