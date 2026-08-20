import * as jwt from 'jsonwebtoken';
import type { Env } from '../../../config/env.schema';
import { InvalidTokenError, TokenExpiredError } from '../application/errors';
import { JwtTokenService } from './jwt-token-service';

describe('JwtTokenService', () => {
  const mockEnv = {
    JWT_SECRET: 'test-jwt-secret-key-1234567890',
  } as Env;

  let service: JwtTokenService;

  beforeEach(() => {
    service = new JwtTokenService(mockEnv);
  });

  it('generates a valid access token that can be decoded', () => {
    const payload = {
      sub: 'user-123',
      email: 'test@example.com',
      role: 'USER' as const,
    };
    const token = service.generateAccessToken(payload);

    expect(typeof token).toBe('string');
    const verified = service.verifyAccessToken(token);
    expect(verified).toMatchObject(payload);
  });

  it('throws TokenExpiredError when the token has expired', () => {
    const payload = {
      sub: 'user-123',
      email: 'test@example.com',
      role: 'USER' as const,
    };
    const expiredToken = jwt.sign(payload, mockEnv.JWT_SECRET, {
      expiresIn: '-1s',
    });

    expect(() => service.verifyAccessToken(expiredToken)).toThrow(
      TokenExpiredError,
    );
  });

  it('throws InvalidTokenError when the signature is invalid or corrupted', () => {
    const invalidToken = 'invalid.jwt.token';
    expect(() => service.verifyAccessToken(invalidToken)).toThrow(
      InvalidTokenError,
    );
  });
});
