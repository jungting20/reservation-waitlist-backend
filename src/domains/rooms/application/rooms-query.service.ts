import { Inject, Injectable } from '@nestjs/common';
import {
  ROOM_REPOSITORY,
  type RoomRepository,
} from '../domain/room.repository.port';
import { RoomNotFoundError } from './errors/room-not-found.error';

@Injectable()
export class RoomsQueryService {
  constructor(
    @Inject(ROOM_REPOSITORY) private readonly roomRepository: RoomRepository,
  ) {}

  async getRooms(page: number, limit: number) {
    return this.roomRepository.findPage({
      isActive: true,
      limit,
      offset: (page - 1) * limit,
    });
  }

  async getRoom(roomId: string) {
    const room = await this.roomRepository.findById(roomId);
    if (!room || !room.isActive) {
      throw new RoomNotFoundError();
    }
    return room;
  }
}
