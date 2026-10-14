export const ROOM_QUERY = Symbol('ROOM_QUERY');

export interface ReservationRoom {
  id: string;
  isActive: boolean;
}

export interface RoomQueryPort {
  findById(roomId: string): Promise<ReservationRoom | null>;
}
