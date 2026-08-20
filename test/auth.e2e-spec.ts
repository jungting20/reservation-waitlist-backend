import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../src/domains/users/domain/user.repository.port';
import { User } from '../src/domains/users/domain/user.entity';

describe('Auth & Users (e2e)', () => {
  let app: INestApplication<Server>;
  const inMemoryUsers = new Map<string, User>();

  const mockUserRepo: UserRepository = {
    create(data) {
      const user = User.create({
        id: data.id ?? `user-${String(inMemoryUsers.size + 1)}`,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role ?? 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      inMemoryUsers.set(user.id, user);
      return Promise.resolve(user);
    },
    findById(id) {
      return Promise.resolve(inMemoryUsers.get(id) ?? null);
    },
    findByEmail(email) {
      for (const u of inMemoryUsers.values()) {
        if (u.email === email) return Promise.resolve(u);
      }
      return Promise.resolve(null);
    },
    existsByEmail(email) {
      for (const u of inMemoryUsers.values()) {
        if (u.email === email) return Promise.resolve(true);
      }
      return Promise.resolve(false);
    },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(USER_REPOSITORY)
      .useValue(mockUserRepo)
      .compile();

    app = moduleRef.createNestApplication<INestApplication<Server>>();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/signup - creates a new user (201)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: 'test@example.com',
        password: 'password1234',
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      email: 'test@example.com',
      role: 'USER',
    });
    expect(
      (response.body as Record<string, unknown>).passwordHash,
    ).toBeUndefined();
  });

  it('POST /auth/signup - returns 409 when email is duplicate', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: 'test@example.com',
        password: 'password1234',
      });

    expect(response.status).toBe(409);
    expect((response.body as Record<string, unknown>).code).toBe(
      'EMAIL_ALREADY_EXISTS',
    );
  });

  it('POST /auth/login - returns JWT access token (200)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password1234',
      });

    expect(response.status).toBe(200);
    const body = response.body as {
      accessToken: string;
      user: { email: string };
    };
    expect(body.accessToken).toBeDefined();
    expect(body.user.email).toBe('test@example.com');
  });

  it('POST /auth/login - returns 401 when password is wrong', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrong_password',
      });

    expect(response.status).toBe(401);
    expect((response.body as Record<string, unknown>).code).toBe(
      'UNAUTHENTICATED',
    );
  });

  it('GET /users/me - returns current user profile with valid Bearer token', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password1234',
      });

    const body = loginRes.body as { accessToken: string };
    const token = body.accessToken;

    const meRes = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body).toMatchObject({
      email: 'test@example.com',
      role: 'USER',
    });
  });

  it('GET /users/me - returns 401 without Authorization header', async () => {
    const meRes = await request(app.getHttpServer()).get('/users/me');
    expect(meRes.status).toBe(401);
  });
});
