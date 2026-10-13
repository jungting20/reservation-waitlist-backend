import { InvalidReservationTimeError } from './errors/invalid-reservation-time.error';
import {
  MAX_RESERVATION_DURATION_MINUTES,
  MIN_RESERVATION_DURATION_MINUTES,
  RESERVATION_BOOKING_WINDOW_DAYS,
  RESERVATION_CLOSING_HOUR,
  RESERVATION_OPENING_HOUR,
  RESERVATION_START_MINUTE,
} from './reservation.policy';

export type ReservationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface ReservationProps {
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
}

export type UpdateReservationProps = Partial<
  Pick<ReservationProps, 'status' | 'cancelledByUserId' | 'cancelledAt'>
>;

export class Reservation {
  private constructor(private readonly props: ReservationProps) {}

  static create(props: ReservationProps, now: Date): Reservation {
    Reservation.validateTime(props.startsAt, props.endsAt, now);

    return new Reservation(props);
  }

  static restore(props: ReservationProps): Reservation {
    return new Reservation(props);
  }

  update(props: UpdateReservationProps, now: Date): Reservation {
    return Reservation.restore({ ...this.props, ...props, updatedAt: now });
  }

  private static validateTime(startsAt: Date, endsAt: Date, now: Date): void {
    const startsAtMs = startsAt.getTime();
    const endsAtMs = endsAt.getTime();
    const nowMs = now.getTime();

    // Asia/Seoul은 UTC+09:00이다. 이동한 값의 UTC 필드로 서울 날짜와 시각을 읽는다.
    const seoulOffsetMs = 9 * 60 * 60 * 1000;
    const seoulStart = new Date(startsAtMs + seoulOffsetMs);
    const seoulNow = new Date(nowMs + seoulOffsetMs);

    if (
      seoulStart.getUTCMinutes() !== RESERVATION_START_MINUTE ||
      seoulStart.getUTCSeconds() !== 0 ||
      seoulStart.getUTCMilliseconds() !== 0
    ) {
      throw new InvalidReservationTimeError(
        'Reservation must start on the hour in Asia/Seoul.',
      );
    }

    const durationMinutes = (endsAtMs - startsAtMs) / (60 * 1000);
    if (
      durationMinutes < MIN_RESERVATION_DURATION_MINUTES ||
      durationMinutes > MAX_RESERVATION_DURATION_MINUTES
    ) {
      throw new InvalidReservationTimeError(
        'Reservation duration must be exactly 60 minutes.',
      );
    }

    const startHour = seoulStart.getUTCHours();
    if (
      startHour < RESERVATION_OPENING_HOUR ||
      startHour + durationMinutes / 60 > RESERVATION_CLOSING_HOUR
    ) {
      throw new InvalidReservationTimeError(
        'Reservation must be within 09:00–22:00 in Asia/Seoul.',
      );
    }

    if (startsAtMs <= nowMs) {
      throw new InvalidReservationTimeError(
        'Reservation must start in the future.',
      );
    }

    const bookingWindowEndMs = Date.UTC(
      seoulNow.getUTCFullYear(),
      seoulNow.getUTCMonth(),
      seoulNow.getUTCDate() + RESERVATION_BOOKING_WINDOW_DAYS,
    );
    if (seoulStart.getTime() >= bookingWindowEndMs) {
      throw new InvalidReservationTimeError(
        'Reservation must be within 30 calendar days including today in Asia/Seoul.',
      );
    }
  }

  get reservationId(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get roomId(): string {
    return this.props.roomId;
  }

  get startsAt(): Date {
    return this.props.startsAt;
  }

  get endsAt(): Date {
    return this.props.endsAt;
  }

  get status(): ReservationStatus {
    return this.props.status;
  }

  get cancelledByUserId(): string | null {
    return this.props.cancelledByUserId;
  }

  get cancelledAt(): Date | null {
    return this.props.cancelledAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
