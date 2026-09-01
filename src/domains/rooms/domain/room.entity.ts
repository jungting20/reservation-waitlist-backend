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
