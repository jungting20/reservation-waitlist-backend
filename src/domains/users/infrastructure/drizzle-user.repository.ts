import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { Repository } from '../../../common/infrastructure/repository';
import { DRIZZLE_DB } from '../../../database/database.constants';
import type { AppDatabase } from '../../../database/database.types';
import { users, type UserSelect } from '../../../database/schema/users';
import { User } from '../domain/user.entity';
import type {
  CreateUserData,
  UserRepository,
} from '../domain/user.repository.port';

@Injectable()
export class DrizzleUserRepository
  extends Repository<UserSelect, User>
  implements UserRepository
{
  constructor(@Inject(DRIZZLE_DB) private readonly db: AppDatabase) {
    super();
  }

  protected mapToDomain(row: UserSelect): User {
    return User.create({
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      role: row.role,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async create(data: CreateUserData): Promise<User> {
    const insertValues: {
      id?: string;
      email: string;
      passwordHash: string;
      role?: 'USER' | 'ADMIN';
    } = {
      email: data.email,
      passwordHash: data.passwordHash,
    };
    if (data.id !== undefined) {
      insertValues.id = data.id;
    }
    if (data.role !== undefined) {
      insertValues.role = data.role;
    }

    const [inserted] = await this.db
      .insert(users)
      .values(insertValues)
      .returning();

    if (!inserted) {
      throw new Error('Failed to create user in database');
    }

    return this.mapToDomain(inserted);
  }

  async findById(id: string): Promise<User | null> {
    const rows = await this.db.select().from(users).where(eq(users.id, id));
    const row = rows[0];
    if (!row) {
      return null;
    }
    return this.mapToDomain(row);
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));
    const row = rows[0];
    if (!row) {
      return null;
    }
    return this.mapToDomain(row);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email));
    return Boolean(rows[0]);
  }
}
