import { z } from 'zod';

export const getRoomsQueryDtoSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(10),
});

export type GetRoomsQueryDto = z.infer<typeof getRoomsQueryDtoSchema>;
