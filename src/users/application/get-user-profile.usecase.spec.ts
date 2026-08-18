import { User } from '../domain/user.entity';
import type { UserRepository } from '../domain/user.repository.port';
import { GetUserProfileUseCase } from './get-user-profile.usecase';
import { UserNotFoundError } from './errors/user-not-found.error';

describe('GetUserProfileUseCase', () => {
  let mockUserRepo: jest.Mocked<UserRepository>;
  let useCase: GetUserProfileUseCase;

  beforeEach(() => {
    mockUserRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      existsByEmail: jest.fn(),
    };
    useCase = new GetUserProfileUseCase(mockUserRepo);
  });

  it('returns user profile when user exists', async () => {
    const user = User.create({
      id: 'user-uuid-1',
      email: 'user@example.com',
      passwordHash: 'hashed_pw',
      role: 'USER',
      createdAt: new Date('2026-08-18T10:00:00Z'),
      updatedAt: new Date('2026-08-18T10:00:00Z'),
    });
    mockUserRepo.findById.mockResolvedValue(user);

    const result = await useCase.execute({ userId: 'user-uuid-1' });

    expect(result).toEqual({
      id: 'user-uuid-1',
      email: 'user@example.com',
      role: 'USER',
      createdAt: '2026-08-18T10:00:00.000Z',
    });
    expect(mockUserRepo.findById).toHaveBeenCalledWith('user-uuid-1');
  });

  it('throws UserNotFoundError when user is not found', async () => {
    mockUserRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: 'non-existing-id' }),
    ).rejects.toThrow(UserNotFoundError);
    expect(mockUserRepo.findById).toHaveBeenCalledWith('non-existing-id');
  });
});
