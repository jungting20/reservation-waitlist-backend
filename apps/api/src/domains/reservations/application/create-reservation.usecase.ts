import { Inject, Injectable } from '@nestjs/common';
import { Reservation } from '../domain/reservation.entity';
import {
  RESERVATION_REPOSITORY,
  type ReservationRepository,
} from '../domain/reservation.repository.port';

export interface CreateReservationCommand {
  userId: string;
  roomId: string;
  startsAt: Date;
  endsAt: Date;
}

@Injectable()
export class CreateReservationUseCase {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservationRepository: ReservationRepository,
  ) {}

  async execute(command: CreateReservationCommand): Promise<Reservation> {
    const now = new Date();
    const reservation = Reservation.create(
      {
        ...command,
        id: crypto.randomUUID(),
        status: 'PENDING',
        cancelledByUserId: null,
        cancelledAt: null,
        createdAt: now,
        updatedAt: now,
      },
      now,
    );

    return this.reservationRepository.save(reservation);
  }
}
