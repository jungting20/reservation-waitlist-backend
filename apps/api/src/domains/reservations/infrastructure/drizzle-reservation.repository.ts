import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { Repository } from '../../../common/infrastructure/repository';
import { DRIZZLE_DB } from '../../../database/database.constants';
import type { AppDatabase } from '../../../database/database.types';
import {
  reservations,
  type ReservationSelect,
} from '../../../database/schema/reservations';
import { Reservation } from '../domain/reservation.entity';
import type { ReservationRepository } from '../domain/reservation.repository.port';

@Injectable()
export class DrizzleReservationRepository
  extends Repository<ReservationSelect, Reservation>
  implements ReservationRepository
{
  constructor(@Inject(DRIZZLE_DB) private readonly db: AppDatabase) {
    super();
  }

  protected mapToDomain(row: ReservationSelect): Reservation {
    return Reservation.restore({
      id: row.id,
      userId: row.userId,
      roomId: row.roomId,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      status: row.status,
      cancelledByUserId: row.cancelledByUserId,
      cancelledAt: row.cancelledAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<Reservation | null> {
    const rows = await this.db
      .select()
      .from(reservations)
      .where(eq(reservations.id, id));
    const row = rows[0];
    if (!row) {
      return null;
    }

    return this.mapToDomain(row);
  }

  async save(input: Reservation): Promise<Reservation> {
    const [inserted] = await this.db
      .insert(reservations)
      .values({
        id: input.reservationId,
        userId: input.userId,
        roomId: input.roomId,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        status: input.status,
        cancelledByUserId: input.cancelledByUserId,
        cancelledAt: input.cancelledAt,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
      })
      .returning();

    if (!inserted) {
      throw new Error('Failed to create reservation in database');
    }

    return this.mapToDomain(inserted);
  }

  async update(input: Reservation): Promise<Reservation> {
    const [updated] = await this.db
      .update(reservations)
      .set({
        status: input.status,
        cancelledByUserId: input.cancelledByUserId,
        cancelledAt: input.cancelledAt,
        updatedAt: input.updatedAt,
      })
      .where(eq(reservations.id, input.reservationId))
      .returning();

    if (!updated) {
      throw new Error('Failed to update reservation in database');
    }

    return this.mapToDomain(updated);
  }
}
