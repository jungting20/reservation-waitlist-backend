import { Inject, Injectable } from '@nestjs/common';
import { Room } from '../domain/room.entity';
import {
  ROOM_REPOSITORY,
  type RoomRepository,
} from '../domain/room.repository.port';

export interface CreateRoomCommand {
  name: string;
  description: string;
  capacity: number;
  createdBy: string;
}

@Injectable()
export class CreateRoomUseCase {
  constructor(
    @Inject(ROOM_REPOSITORY) private readonly roomRepository: RoomRepository,
  ) {}

  async execute(command: CreateRoomCommand): Promise<Room> {
    const room = Room.create({
      ...command,
      id: crypto.randomUUID(),
      isActive: true,
      createdAt: new Date(),
    });

    return this.roomRepository.save(room);
  }
}
