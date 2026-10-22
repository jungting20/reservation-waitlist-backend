import { Inject, Injectable } from '@nestjs/common';
import { Reservation } from '../domain/reservation.entity';
import {
  RESERVATION_REPOSITORY,
  type ReservationRepository,
} from '../domain/reservation.repository.port';
import { ROOM_QUERY, type RoomQueryPort } from './ports/room-query.port';
import { ReservationRoomNotFoundError } from './errors/reservation-room-not-found.error';
import { ReservationRoomInactiveError } from './errors/reservation-room-inactive.error';

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

    @Inject(ROOM_QUERY)
    private readonly roomQueryPort: RoomQueryPort,
  ) {}

  async execute(command: CreateReservationCommand): Promise<Reservation> {
    const now = new Date();
    //roomId로 방 상태 조회
    const room = await this.roomQueryPort.findById(command.roomId);
    if (!room) {
      throw new ReservationRoomNotFoundError();
    }
    if (!room.isActive) {
      throw new ReservationRoomInactiveError();
    }
    //userId, roomid, startsAt 으로 일단 예약조회
    const exists =
      await this.reservationRepository.existsOverlappingReservation(
        command.roomId,
        command.startsAt,
      );

    if (exists) {
      throw new Error('Room is already reserved');
    }

    const reservation = Reservation.create(
      {
        ...command,
        id: crypto.randomUUID(),
        status: 'CONFIRMED',
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
