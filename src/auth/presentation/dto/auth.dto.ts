import { z } from 'zod';

export const signUpDtoSchema = z.object({
  email: z.email(),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  role: z.enum(['USER', 'ADMIN']).optional(),
});

export type SignUpDto = z.infer<typeof signUpDtoSchema>;

export const loginDtoSchema = z.object({
  email: z.email(),
  password: z.string().min(1, { message: 'Password is required' }),
});


export type LoginDto = z.infer<typeof loginDtoSchema>;
