import type { Reservation } from './reservation.entity';

export const RESERVATION_REPOSITORY = Symbol('RESERVATION_REPOSITORY');

export interface ReservationRepository {
  save(input: Reservation): Promise<Reservation>;
  update(input: Reservation): Promise<Reservation>;
  findById(id: string): Promise<Reservation | null>;
}
