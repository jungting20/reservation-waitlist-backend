import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { TokenService } from '../../application/ports/token-service.port';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockTokenService: jest.Mocked<TokenService>;

  beforeEach(() => {
    mockTokenService = {
      generateAccessToken: jest.fn(),
      verifyAccessToken: jest.fn(),
    };
    guard = new AuthGuard(mockTokenService);
  });

  const createMockContext = (authHeader?: string): ExecutionContext => {
    const request = {
      headers: {
        authorization: authHeader,
      },
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('allows access with a valid bearer token and sets request.user', () => {
    const payload = { sub: 'user-uuid', email: 'test@example.com', role: 'USER' as const };
    mockTokenService.verifyAccessToken.mockReturnValue(payload);

    const context = createMockContext('Bearer valid_jwt_token');
    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockTokenService.verifyAccessToken.mock.calls).toEqual([['valid_jwt_token']]);
  });


  it('throws 401 Unauthorized when authorization header is missing', () => {
    const context = createMockContext(undefined);
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('throws 401 Unauthorized when token format is not Bearer', () => {
    const context = createMockContext('Basic 123456');
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
