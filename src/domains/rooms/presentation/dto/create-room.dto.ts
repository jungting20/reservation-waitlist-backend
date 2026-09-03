import { z } from 'zod';
import {
  MAX_ROOM_CAPACITY,
  MIN_ROOM_CAPACITY,
} from '../../domain/room.entity';

export const createRoomDtoSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().max(255).default(''),
  capacity: z
    .number()
    .int()
    .min(MIN_ROOM_CAPACITY)
    .max(MAX_ROOM_CAPACITY),
  isActive: z.boolean().default(true),
});

export type CreateRoomDto = z.infer<typeof createRoomDtoSchema>;
