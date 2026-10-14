import { Injectable } from '@nestjs/common';
import { RoomsQueryService } from '../../rooms/application/rooms-query.service';
import type {
  ReservationRoom,
  RoomQueryPort,
} from '../application/ports/room-query.port';

@Injectable()
export class RoomQueryAdapter implements RoomQueryPort {
  constructor(private readonly roomsQueryService: RoomsQueryService) {}

  async findById(roomId: string): Promise<ReservationRoom | null> {
    const room = await this.roomsQueryService.findRoom(roomId);
    if (!room) {
      return null;
    }

    return {
      id: room.id,
      isActive: room.isActive,
    };
  }
}
