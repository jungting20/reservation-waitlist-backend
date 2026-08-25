import { parseEnv } from './env.schema';

describe('parseEnv', () => {
  const databaseUrl =
    'postgresql://reservation:reservation@localhost:5432/reservation';
  const jwtSecret = 'super_secret_jwt_key_at_least_32_characters_long';

  it('applies defaults and parses a valid database URL and JWT secret', () => {
    expect(
      parseEnv({ DATABASE_URL: databaseUrl, JWT_SECRET: jwtSecret }),
    ).toEqual({
      NODE_ENV: 'development',
      PORT: 18080,
      DATABASE_URL: databaseUrl,
      JWT_SECRET: jwtSecret,
    });
  });

  it.each([undefined, '', 'http://localhost/database'])(
    'rejects invalid DATABASE_URL %p',
    (DATABASE_URL) => {
      expect(() => parseEnv({ DATABASE_URL, JWT_SECRET: jwtSecret })).toThrow();
    },
  );

  it('rejects an invalid port', () => {
    expect(() =>
      parseEnv({
        DATABASE_URL: databaseUrl,
        JWT_SECRET: jwtSecret,
        PORT: '70000',
      }),
    ).toThrow();
  });

  it('rejects JWT_SECRET shorter than 32 characters', () => {
    expect(() =>
      parseEnv({ DATABASE_URL: databaseUrl, JWT_SECRET: 'too_short_secret' }),
    ).toThrow();
  });
});
