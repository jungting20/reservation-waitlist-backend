import type { Room } from './room.entity';

export const ROOM_REPOSITORY = Symbol('ROOM_REPOSITORY');

export interface CreateRoomInput {
  name: string;
  description: string;
  capacity: number;
  createdBy: string;
}

export interface RoomRepository {
  create(input: CreateRoomInput): Promise<Room>;
  findAll(): Promise<Room[]>;
  findById(id: string): Promise<Room | null>;
}
