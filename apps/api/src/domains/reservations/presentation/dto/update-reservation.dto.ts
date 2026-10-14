import { z } from 'zod';

export const updateReservationDtoSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED']).optional(),
  cancelledByUserId: z.uuid().nullable().optional(),
  cancelledAt: z.iso
    .datetime({ offset: true })
    .transform((value) => new Date(value))
    .nullable()
    .optional(),
});

export type UpdateReservationDto = z.infer<typeof updateReservationDtoSchema>;
