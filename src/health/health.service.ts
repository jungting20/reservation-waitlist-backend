import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '../database/database.constants';
import type { HealthResponse } from './health.types';

@Injectable()
export class HealthService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async check(): Promise<HealthResponse> {
    try {
      const query = { text: 'SELECT 1', query_timeout: 1_000 };
      await this.pool.query(query);
      return { status: 'ok', database: 'up' };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'down',
      });
    }
  }
}
