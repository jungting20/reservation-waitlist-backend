import type {
  Reservation,
  ReservationStatus,
} from '../domain/reservation.entity';
import type { ReservationListItem } from '../domain/reservation.repository.port';

export interface ReservationResponse {
  id: string;
  userId: string;
  roomId: string;
  startsAt: string;
  endsAt: string;
  status: ReservationStatus;
  cancelledByUserId: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReservationListItemResponse extends ReservationResponse {
  user: ReservationListItem['user'];
}

export function toReservationResponse(
  reservation: Reservation,
): ReservationResponse {
  return {
    id: reservation.reservationId,
    userId: reservation.userId,
    roomId: reservation.roomId,
    startsAt: reservation.startsAt.toISOString(),
    endsAt: reservation.endsAt.toISOString(),
    status: reservation.status,
    cancelledByUserId: reservation.cancelledByUserId,
    cancelledAt: reservation.cancelledAt?.toISOString() ?? null,
    createdAt: reservation.createdAt.toISOString(),
    updatedAt: reservation.updatedAt.toISOString(),
  };
}

export function toReservationListItemResponse(
  reservation: ReservationListItem,
): ReservationListItemResponse {
  return {
    ...reservation,
    startsAt: reservation.startsAt.toISOString(),
    endsAt: reservation.endsAt.toISOString(),
    cancelledAt: reservation.cancelledAt?.toISOString() ?? null,
    createdAt: reservation.createdAt.toISOString(),
    updatedAt: reservation.updatedAt.toISOString(),
  };
}
