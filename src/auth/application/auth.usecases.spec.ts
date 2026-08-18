import { User } from '../../users/domain/user.entity';
import type { UserRepository } from '../../users/domain/user.repository.port';
import { SignUpUseCase } from './signup.usecase';
import { LoginUseCase } from './login.usecase';
import type { PasswordHasher } from './ports/password-hasher.port';
import type { TokenService } from './ports/token-service.port';

describe('Auth UseCases', () => {
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockPasswordHasher: jest.Mocked<PasswordHasher>;
  let mockTokenService: jest.Mocked<TokenService>;

  beforeEach(() => {
    mockUserRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      existsByEmail: jest.fn(),
    };
    mockPasswordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    };
    mockTokenService = {
      generateAccessToken: jest.fn(),
      verifyAccessToken: jest.fn(),
    };
  });

  describe('SignUpUseCase', () => {
    it('creates a user when email is not taken', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockPasswordHasher.hash.mockResolvedValue('hashed_pw');
      mockUserRepo.create.mockResolvedValue(
        User.create({
          id: 'user-uuid',
          email: 'test@example.com',
          passwordHash: 'hashed_pw',
          role: 'USER',
          createdAt: new Date('2026-08-18T10:00:00Z'),
          updatedAt: new Date('2026-08-18T10:00:00Z'),
        }),
      );

      const useCase = new SignUpUseCase(mockUserRepo, mockPasswordHasher);
      const result = await useCase.execute({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.email).toBe('test@example.com');
      expect(result.role).toBe('USER');
      expect(mockPasswordHasher.hash.mock.calls).toEqual([['password123']]);

    });

    it('throws 409 Conflict when email already exists', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(
        User.create({
          id: 'user-uuid',
          email: 'existing@example.com',
          passwordHash: 'hashed_pw',
          role: 'USER',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const useCase = new SignUpUseCase(mockUserRepo, mockPasswordHasher);
      await expect(
        useCase.execute({
          email: 'existing@example.com',
          password: 'password123',
        }),
      ).rejects.toMatchObject({
        status: 409,
      });
    });
  });

  describe('LoginUseCase', () => {
    it('returns token when credentials are valid', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(
        User.create({
          id: 'user-uuid',
          email: 'test@example.com',
          passwordHash: 'hashed_pw',
          role: 'USER',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );
      mockPasswordHasher.compare.mockResolvedValue(true);
      mockTokenService.generateAccessToken.mockReturnValue('jwt_token_123');

      const useCase = new LoginUseCase(
        mockUserRepo,
        mockPasswordHasher,
        mockTokenService,
      );
      const result = await useCase.execute({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.accessToken).toBe('jwt_token_123');
      expect(result.user.email).toBe('test@example.com');
    });

    it('throws 401 Unauthorized when password does not match', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(
        User.create({
          id: 'user-uuid',
          email: 'test@example.com',
          passwordHash: 'hashed_pw',
          role: 'USER',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );
      mockPasswordHasher.compare.mockResolvedValue(false);

      const useCase = new LoginUseCase(
        mockUserRepo,
        mockPasswordHasher,
        mockTokenService,
      );
      await expect(
        useCase.execute({
          email: 'test@example.com',
          password: 'wrong_password',
        }),
      ).rejects.toMatchObject({
        status: 401,
      });
    });
  });
});
