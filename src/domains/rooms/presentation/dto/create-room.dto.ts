import { z } from 'zod';

export const createRoomDtoSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().max(255).default(''),
  capacity: z.number().int().min(1),
  isActive: z.boolean().default(true),
});

export type CreateRoomDto = z.infer<typeof createRoomDtoSchema>;
