import { User } from '../domain/user.entity';
import type { UserRepository } from '../domain/user.repository.port';
import { DrizzleUserRepository } from './drizzle-user.repository';

describe('DrizzleUserRepository', () => {
  let repository: UserRepository;
  let mockDb: {
    insert: jest.Mock;
    select: jest.Mock;
  };

  beforeEach(() => {
    mockDb = {
      insert: jest.fn(),
      select: jest.fn(),
    };
    repository = new DrizzleUserRepository(mockDb as never);
  });

  it('creates and returns a domain User', async () => {
    const dbRow = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      passwordHash: 'hash123',
      role: 'USER' as const,
      createdAt: new Date('2026-08-18T10:00:00Z'),
      updatedAt: new Date('2026-08-18T10:00:00Z'),
    };

    mockDb.insert.mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([dbRow]),
      }),
    });

    const result = await repository.create({
      email: 'user@example.com',
      passwordHash: 'hash123',
    });

    expect(result).toBeInstanceOf(User);
    expect(result.id).toBe(dbRow.id);
    expect(result.email).toBe(dbRow.email);
    expect(result.role).toBe('USER');
  });

  it('finds a user by email', async () => {
    const dbRow = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      passwordHash: 'hash123',
      role: 'USER' as const,
      createdAt: new Date('2026-08-18T10:00:00Z'),
      updatedAt: new Date('2026-08-18T10:00:00Z'),
    };

    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([dbRow]),
      }),
    });

    const result = await repository.findByEmail('user@example.com');
    expect(result).toBeInstanceOf(User);
    expect(result?.email).toBe('user@example.com');
  });

  it('returns null when user is not found by email', async () => {
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });

    const result = await repository.findByEmail('notfound@example.com');
    expect(result).toBeNull();
  });
});
