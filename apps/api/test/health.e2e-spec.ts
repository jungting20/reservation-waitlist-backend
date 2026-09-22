import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PG_POOL } from '../src/database/database.constants';

describe('GET /health', () => {
  describe('with the real test database', () => {
    let app: INestApplication<Server>;

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleRef.createNestApplication<INestApplication<Server>>();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('returns 200 when PostgreSQL is available', async () => {
      const response = await request(app.getHttpServer()).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok', database: 'up' });
    });
  });

  describe('when the database query fails', () => {
    let app: INestApplication<Server>;

    beforeAll(async () => {
      const pool = {
        query: jest.fn().mockRejectedValue(new Error('password=secret')),
        end: jest.fn().mockResolvedValue(undefined),
      };
      const moduleRef = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(PG_POOL)
        .useValue(pool)
        .compile();

      app = moduleRef.createNestApplication<INestApplication<Server>>();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('returns 503 without leaking the connection error', async () => {
      const response = await request(app.getHttpServer()).get('/health');

      expect(response.status).toBe(503);
      expect(response.body).toEqual({ status: 'error', database: 'down' });
      expect(response.text).not.toContain('password=secret');
      expect(response.text.toLowerCase()).not.toContain('stack');
    });
  });
});
