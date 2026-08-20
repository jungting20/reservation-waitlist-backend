import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  MissingAuthHeaderError,
  MissingTokenError,
} from '../../application/errors';
import type { TokenService } from '../../application/ports/token-service.port';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockTokenService: jest.Mocked<TokenService>;
  let reflector: Reflector;

  beforeEach(() => {
    mockTokenService = {
      generateAccessToken: jest.fn(),
      verifyAccessToken: jest.fn(),
    };
    reflector = new Reflector();
    guard = new AuthGuard(mockTokenService, reflector);
  });

  const createMockContext = (authHeader?: string): ExecutionContext => {
    const request = {
      headers: {
        authorization: authHeader,
      },
    };
    return {
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('allows access when route is marked as public (@Public)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    const context = createMockContext(undefined);
    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockTokenService.verifyAccessToken).not.toHaveBeenCalled();
  });

  it('allows access with a valid bearer token and sets request.user', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const payload = {
      sub: 'user-uuid',
      email: 'test@example.com',
      role: 'USER' as const,
    };
    mockTokenService.verifyAccessToken.mockReturnValue(payload);

    const context = createMockContext('Bearer valid_jwt_token');
    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockTokenService.verifyAccessToken.mock.calls).toEqual([
      ['valid_jwt_token'],
    ]);
  });

  it('throws MissingAuthHeaderError when authorization header is missing', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const context = createMockContext(undefined);
    expect(() => guard.canActivate(context)).toThrow(MissingAuthHeaderError);
  });

  it('throws MissingAuthHeaderError when token format is not Bearer', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const context = createMockContext('Basic 123456');
    expect(() => guard.canActivate(context)).toThrow(MissingAuthHeaderError);
  });

  it('throws MissingTokenError when token string is empty', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const context = createMockContext('Bearer ');
    expect(() => guard.canActivate(context)).toThrow(MissingTokenError);
  });
});
