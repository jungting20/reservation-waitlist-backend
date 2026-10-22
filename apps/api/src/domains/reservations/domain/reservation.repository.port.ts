import type { Reservation, ReservationStatus } from './reservation.entity';

export const RESERVATION_REPOSITORY = Symbol('RESERVATION_REPOSITORY');

export interface ReservationListItem {
  id: string;
  userId: string;
  roomId: string;
  startsAt: Date;
  endsAt: Date;
  status: ReservationStatus;
  cancelledByUserId: string | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    email: string;
  };
}

export interface ReservationRepository {
  list(): Promise<ReservationListItem[]>;
  save(input: Reservation): Promise<Reservation>;
  update(input: Reservation): Promise<Reservation>;
  findById(id: string): Promise<Reservation | null>;
  existsOverlappingReservation(
    roomId: string,
    startsAt: Date,
  ): Promise<boolean>;
}
