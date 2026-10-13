import { Inject, Injectable } from '@nestjs/common';
import type {
  Reservation,
  UpdateReservationProps,
} from '../domain/reservation.entity';
import {
  RESERVATION_REPOSITORY,
  type ReservationRepository,
} from '../domain/reservation.repository.port';
import { ReservationNotFoundError } from './errors/reservation-not-found.error';

export interface UpdateReservationCommand extends UpdateReservationProps {
  reservationId: string;
}

@Injectable()
export class UpdateReservationUseCase {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservationRepository: ReservationRepository,
  ) {}

  async execute(command: UpdateReservationCommand): Promise<Reservation> {
    const reservation = await this.reservationRepository.findById(
      command.reservationId,
    );
    if (!reservation) {
      throw new ReservationNotFoundError();
    }

    const { reservationId: _, ...updateProps } = command;
    const updatedReservation = reservation.update(updateProps, new Date());

    return this.reservationRepository.update(updatedReservation);
  }
}
