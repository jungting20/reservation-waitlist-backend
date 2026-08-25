import { Inject, Injectable } from '@nestjs/common';
import {
  ROOM_REPOSITORY,
  type RoomRepository,
} from '../domain/room.repository.port';

@Injectable()
export class GetRoomsUseCase {
  constructor(
    @Inject(ROOM_REPOSITORY) private readonly roomRepository: RoomRepository,
  ) {}

  async getRooms() {
    return this.roomRepository.findAll();
  }

  async getRoom(roomId: string) {
    return this.roomRepository.findById(roomId);
  }
}
