import {
  Global,
  Inject,
  Injectable,
  Module,
  type OnModuleDestroy,
} from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { ConfigModule } from '../config/config.module';
import { ENV } from '../config/config.constants';
import type { Env } from '../config/env.schema';
import { DRIZZLE_DB, PG_POOL } from './database.constants';
import type { AppDatabase } from './database.types';
import * as schema from './schema';

@Injectable()
class DatabaseLifecycle implements OnModuleDestroy {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PG_POOL,
      inject: [ENV],
      useFactory: (env: Env): Pool =>
        new Pool({
          connectionString: env.DATABASE_URL,
          connectionTimeoutMillis: 1_000,
        }),
    },
    {
      provide: DRIZZLE_DB,
      inject: [PG_POOL],
      useFactory: (pool: Pool): AppDatabase => drizzle(pool, { schema }),
    },
    DatabaseLifecycle,
  ],
  exports: [PG_POOL, DRIZZLE_DB],
})
export class DatabaseModule {}
