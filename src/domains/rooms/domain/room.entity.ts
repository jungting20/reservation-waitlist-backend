import { InvalidRoomCapacityError } from './errors/invalid-room-capacity.error';

export const MIN_ROOM_CAPACITY = 2;
export const MAX_ROOM_CAPACITY = 6;

export interface RoomProps {
  id: string;
  name: string;
  description: string;
  capacity: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}

export class Room {
  private constructor(private readonly props: RoomProps) {}

  static create(props: RoomProps): Room {
    if (
      !Number.isInteger(props.capacity) ||
      props.capacity < MIN_ROOM_CAPACITY ||
      props.capacity > MAX_ROOM_CAPACITY
    ) {
      throw new InvalidRoomCapacityError(
        props.capacity,
        MIN_ROOM_CAPACITY,
        MAX_ROOM_CAPACITY,
      );
    }

    return new Room(props);
  }

  get roomId(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get capacity(): number {
    return this.props.capacity;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
