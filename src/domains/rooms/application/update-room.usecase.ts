import { Inject, Injectable } from '@nestjs/common';
import {
  ROOM_REPOSITORY,
  type RoomRepository,
} from '../domain/room.repository.port';
import type { Room, UpdateRoomProps } from '../domain/room.entity';
import { RoomNotFoundError } from './errors/room-not-found.error';

export interface UpdateRoomCommand extends UpdateRoomProps {
  roomId: string;
}

@Injectable()
export class UpdateRoomUseCase {
  constructor(
    @Inject(ROOM_REPOSITORY) private readonly roomRepository: RoomRepository,
  ) {}

  async execute(command: UpdateRoomCommand): Promise<Room> {
    const room = await this.roomRepository.findById(command.roomId);
    if (!room) {
      throw new RoomNotFoundError();
    }

    const { roomId: _, ...updateProps } = command;
    const updatedRoom = room.update(updateProps);

    return this.roomRepository.update(updatedRoom);
  }
}
