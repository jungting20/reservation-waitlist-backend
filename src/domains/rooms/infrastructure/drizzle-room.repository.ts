import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { Repository } from '../../../common/infrastructure/repository';
import { DRIZZLE_DB } from '../../../database/database.constants';
import type { AppDatabase } from '../../../database/database.types';
import { rooms, type RoomSelect } from '../../../database/schema/rooms';
import { Room } from '../domain/room.entity';
import type {
  CreateRoomInput,
  RoomRepository,
} from '../domain/room.repository.port';

@Injectable()
export class DrizzleRoomRepository
  extends Repository<RoomSelect, Room>
  implements RoomRepository
{
  constructor(@Inject(DRIZZLE_DB) private readonly db: AppDatabase) {
    super();
  }

  protected mapToDomain(row: RoomSelect): Room {
    return Room.create({
      id: row.id,
      name: row.name,
      description: row.description,
      capacity: row.capacity,
      isActive: row.isActive,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
    });
  }

  async create(input: CreateRoomInput): Promise<Room> {
    const [inserted] = await this.db.insert(rooms).values(input).returning();

    if (!inserted) {
      throw new Error('Failed to create room in database');
    }

    return this.mapToDomain(inserted);
  }

  async findAll(): Promise<Room[]> {
    const rows = await this.db.select().from(rooms);
    return rows.map((row) => this.mapToDomain(row));
  }

  async findById(id: string): Promise<Room | null> {
    const rows = await this.db.select().from(rooms).where(eq(rooms.id, id));
    const row = rows[0];
    if (!row) {
      return null;
    }
    return this.mapToDomain(row);
  }
}
