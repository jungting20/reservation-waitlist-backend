import type { Room } from './room.entity';

export const ROOM_REPOSITORY = Symbol('ROOM_REPOSITORY');

export interface CreateRoomInput {
  name: string;
  description: string;
  capacity: number;
  createdBy: string;
}

export interface FindRoomsQuery {
  isActive?: boolean;
  limit: number;
  offset: number;
}

export interface FindRoomsResult {
  items: Room[];
  total: number;
}

export interface RoomRepository {
  save(input: Room): Promise<Room>;
  update(input: Room): Promise<Room>;
  findAll(): Promise<Room[]>;
  findPage(query: FindRoomsQuery): Promise<FindRoomsResult>;
  findById(id: string): Promise<Room | null>;
}
