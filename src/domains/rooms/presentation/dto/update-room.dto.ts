import { z } from 'zod';
import { MAX_ROOM_CAPACITY, MIN_ROOM_CAPACITY } from '../../domain/room.policy';

export const updateRoomDtoSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  description: z.string().max(255).optional(),
  capacity: z
    .number()
    .int()
    .min(MIN_ROOM_CAPACITY)
    .max(MAX_ROOM_CAPACITY)
    .optional(),
  isActive: z.boolean().optional(),
});

export type UpdateRoomDto = z.infer<typeof updateRoomDtoSchema>;
