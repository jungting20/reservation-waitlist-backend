import type { Room } from '../domain/room.entity';

export interface RoomResponse {
  id: string;
  name: string;
  description: string;
  capacity: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export function toRoomResponse(room: Room): RoomResponse {
  return {
    id: room.roomId,
    name: room.name,
    description: room.description,
    capacity: room.capacity,
    isActive: room.isActive,
    createdBy: room.createdBy,
    createdAt: room.createdAt.toISOString(),
  };
}
