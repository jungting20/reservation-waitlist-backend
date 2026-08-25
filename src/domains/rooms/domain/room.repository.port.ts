import type { Room } from './room.entity';

export const ROOM_REPOSITORY = Symbol('ROOM_REPOSITORY');

export interface RoomRepository {
  findAll(): Promise<Room[]>;
  findById(id: string): Promise<Room | null>;
}
