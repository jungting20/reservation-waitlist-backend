import { Inject, Injectable } from '@nestjs/common';
import {
  RESERVATION_REPOSITORY,
  type ReservationListItem,
  type ReservationRepository,
} from '../domain/reservation.repository.port';

@Injectable()
export class ListReservationsUseCase {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservationRepository: ReservationRepository,
  ) {}

  async execute(): Promise<ReservationListItem[]> {
    return this.reservationRepository.list();
  }
}
