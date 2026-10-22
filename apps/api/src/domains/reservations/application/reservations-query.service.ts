import { Inject, Injectable } from '@nestjs/common';
import {
  RESERVATION_REPOSITORY,
  type ReservationListItem,
  type ReservationRepository,
} from '../domain/reservation.repository.port';

@Injectable()
export class ReservationsQueryService {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservationRepository: ReservationRepository,
  ) {}

  async list(): Promise<ReservationListItem[]> {
    return this.reservationRepository.list();
  }
}
