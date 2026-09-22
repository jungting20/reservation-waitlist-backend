import { type Pool } from 'pg';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let pool: { query: jest.Mock };
  let service: HealthService;

  beforeEach(() => {
    pool = { query: jest.fn() };
    service = new HealthService(pool as unknown as Pool);
  });

  it('returns up when SELECT 1 succeeds', async () => {
    pool.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });

    await expect(service.check()).resolves.toEqual({
      status: 'ok',
      database: 'up',
    });
    expect(pool.query).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'SELECT 1' }),
    );
  });

  it('throws 503 without leaking the connection error', async () => {
    pool.query.mockRejectedValue(new Error('password=secret'));

    await expect(service.check()).rejects.toMatchObject({
      status: 503,
      response: { status: 'error', database: 'down' },
    });
  });
});
