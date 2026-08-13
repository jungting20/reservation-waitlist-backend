import { Test } from '@nestjs/testing';
import { Pool } from 'pg';
import { ConfigModule } from '../config/config.module';
import { ENV } from '../config/config.constants';
import type { Env } from '../config/env.schema';
import { DRIZZLE_DB, PG_POOL } from './database.constants';
import { DatabaseModule } from './database.module';

describe('DatabaseModule', () => {
  it('provides a bounded pool and one Drizzle database and closes the pool', async () => {
    const endSpy = jest
      .spyOn(Pool.prototype as { end: () => Promise<void> }, 'end')
      .mockResolvedValue(undefined);
    const env: Env = {
      NODE_ENV: 'test',
      PORT: 3000,
      DATABASE_URL:
        'postgresql://reservation:reservation@localhost:5432/reservation_test',
    };
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule, DatabaseModule],
    })
      .overrideProvider(ENV)
      .useValue(env)
      .compile();

    const pool = moduleRef.get<Pool>(PG_POOL);

    expect(pool).toBeInstanceOf(Pool);
    expect(pool.options.connectionTimeoutMillis).toBe(1_000);
    expect(moduleRef.get(DRIZZLE_DB)).toBeDefined();
    await moduleRef.close();
    expect(endSpy).toHaveBeenCalledTimes(1);
  });
});
