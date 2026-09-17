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

export class Reservation {
  private constructor(private readonly props: ReservationProps) {}

  static create(props: ReservationProps): Reservation {
    return new Reservation(props);
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
