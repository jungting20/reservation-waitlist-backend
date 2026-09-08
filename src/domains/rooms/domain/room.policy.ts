import { InvalidRoomCapacityError } from './errors/invalid-room-capacity.error';

export const MIN_ROOM_CAPACITY = 2;
export const MAX_ROOM_CAPACITY = 6;

export function validateCapacity(capacity: number): void {
  if (
    !Number.isInteger(capacity) ||
    capacity < MIN_ROOM_CAPACITY ||
    capacity > MAX_ROOM_CAPACITY
  ) {
    throw new InvalidRoomCapacityError(
      capacity,
      MIN_ROOM_CAPACITY,
      MAX_ROOM_CAPACITY,
    );
  }
}
