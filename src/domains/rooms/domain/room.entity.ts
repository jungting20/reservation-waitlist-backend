import type { Entity } from '../../../common/domain/entity.interface';

export interface RoomProps {
  roomId: string;
  createdBy: string;
  createdAt: Date;
}

export interface RoomResponse {
  roomId: string;
  createdBy: string;
  createdAt: string;
}

export class Room implements Entity<RoomResponse> {
  private constructor(private readonly props: RoomProps) {}

  static create(props: RoomProps): Room {
    return new Room(props);
  }

  get roomId(): string {
    return this.props.roomId;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toResponse(): RoomResponse {
    return {
      roomId: this.props.roomId,
      createdBy: this.props.createdBy,
      createdAt: this.props.createdAt.toISOString(),
    };
  }
}
