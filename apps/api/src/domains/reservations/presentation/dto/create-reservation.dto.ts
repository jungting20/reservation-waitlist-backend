import { z } from 'zod';

export const createReservationDtoSchema = z.object({
  roomId: z.uuid(),
  startsAt: z.iso
    .datetime({ offset: true })
    .transform((value) => new Date(value)),
  endsAt: z.iso
    .datetime({ offset: true })
    .transform((value) => new Date(value)),
});

export type CreateReservationDto = z.infer<typeof createReservationDtoSchema>;
