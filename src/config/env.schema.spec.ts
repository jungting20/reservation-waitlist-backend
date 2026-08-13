import { parseEnv } from './env.schema';

describe('parseEnv', () => {
  const databaseUrl = 'postgresql://reservation:reservation@localhost:5432/reservation';

  it('applies defaults and parses a valid database URL', () => {
    expect(parseEnv({ DATABASE_URL: databaseUrl })).toEqual({
      NODE_ENV: 'development',
      PORT: 3000,
      DATABASE_URL: databaseUrl,
    });
  });

  it.each([undefined, '', 'http://localhost/database'])(
    'rejects invalid DATABASE_URL %p',
    (DATABASE_URL) => expect(() => parseEnv({ DATABASE_URL })).toThrow(),
  );

  it('rejects an invalid port', () => {
    expect(() => parseEnv({ DATABASE_URL: databaseUrl, PORT: '70000' })).toThrow();
  });
});
