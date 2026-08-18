# Phase 1 프로젝트 기반 구성 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** pnpm·mise 기반 NestJS 11 프로젝트에 Zod 환경검증, Drizzle/PostgreSQL 연결, DB 상태를 확인하는 Health API, 테스트와 CI를 구축한다.

**Architecture:** `ConfigModule`, `DatabaseModule`, `HealthModule`을 분리한다. 환경변수는 Zod로 한 번 파싱한 객체만 주입하고, 데이터베이스 모듈은 하나의 `pg.Pool`과 그 pool을 사용하는 Drizzle 인스턴스를 제공한다. migration은 애플리케이션 시작과 분리하고, 로컬 DB 재생성 명령은 운영 환경과 비로컬 DB를 거부한다.

**Tech Stack:** Node.js 24.18.0, pnpm 10.34.3, TypeScript 6.0.3, NestJS 11, PostgreSQL 17, Drizzle ORM/Drizzle Kit, node-postgres, Zod, Jest, Supertest, Docker Compose, GitHub Actions

## Global Constraints

- `mise.toml`에 Node.js `24.18.0`과 pnpm `10.34.3`을 정확히 고정한다.
- `package.json`에 TypeScript `6.0.3`을 정확히 고정하고 NestJS 11과의 실제 호환성을 전체 검증으로 증명한다.
- 패키지 매니저는 pnpm만 사용하며 `packageManager`와 `pnpm-lock.yaml`을 커밋한다.
- DB 설정 입력은 단일 `DATABASE_URL`이고 Zod 검증 전 값을 애플리케이션 서비스에서 직접 읽지 않는다.
- 서버 시작 시 migration을 자동 실행하지 않는다.
- Phase 1에서는 사용자·방·예약·대기열 테이블과 API를 만들지 않는다.
- 실제 비밀값과 `.env`는 커밋하지 않는다.
- 기존 Phase 0 문서는 보존하고 관련 없는 내용을 변경하지 않는다.
- 커밋 메시지는 반드시 한글로 작성한다.

---

## File Structure

- `mise.toml`: Node.js와 pnpm 런타임 버전 고정
- `package.json`, `pnpm-lock.yaml`: 스크립트와 정확한 dependency resolution
- `nest-cli.json`, `tsconfig.json`, `tsconfig.build.json`: NestJS·TypeScript 빌드 설정
- `eslint.config.mjs`, `.prettierrc`: lint와 formatting 규칙
- `src/main.ts`, `src/app.module.ts`: bootstrap과 루트 모듈
- `src/config/env.schema.ts`: 환경변수 schema, `Env` 타입, `parseEnv()`
- `src/config/config.constants.ts`, `src/config/config.module.ts`: 검증된 환경설정 DI token과 global provider
- `src/database/database.constants.ts`: pool과 Drizzle DI token
- `src/database/database.types.ts`: `AppDatabase` 타입
- `src/database/database.module.ts`: pool과 Drizzle provider 생명주기
- `src/database/schema/index.ts`: Drizzle schema export 진입점
- `drizzle.config.ts`, `drizzle/`: Drizzle Kit 설정과 baseline migration
- `src/health/health.service.ts`, `health.controller.ts`, `health.module.ts`: DB health check
- `docker/postgres/init/01-create-test-database.sql`, `compose.yaml`: 개발·테스트 PostgreSQL
- `scripts/reset-local-databases.ts`: 안전 조건이 있는 로컬 DB 재생성
- `test/health.e2e-spec.ts`, `test/jest-e2e.json`: HTTP E2E 검증
- `.github/workflows/ci.yml`: PostgreSQL을 포함한 전체 CI
- `.env.example`, `README.md`: 실행 예시와 작업 절차

---

### Task 1: mise·pnpm·NestJS 골격

**Files:**

- Create: `mise.toml`
- Create: `package.json`
- Create: `pnpm-lock.yaml`
- Create: `nest-cli.json`
- Create: `tsconfig.json`
- Create: `tsconfig.build.json`
- Create: `eslint.config.mjs`
- Create: `.prettierrc`
- Create: `src/main.ts`
- Create: `src/app.module.ts`
- Create: `src/app.module.spec.ts`
- Modify: `.gitignore`

**Interfaces:**

- Produces: NestJS `AppModule`, scripts `build`, `start`, `start:dev`, `lint`, `typecheck`, `test`, `test:e2e`
- Consumes: 없음

- [ ] **Step 1: 런타임 버전을 고정한다**

```toml
[tools]
node = "24.18.0"
pnpm = "10.34.3"
```

Run: `mise install && mise exec -- node --version && mise exec -- pnpm --version`
Expected: `v24.18.0`과 `10.34.3` 출력

- [ ] **Step 2: pnpm 기반 NestJS package manifest를 작성하고 설치한다**

`package.json`의 핵심 내용:

```json
{
  "name": "reservation-waitlist-backend",
  "version": "0.0.1",
  "private": true,
  "license": "UNLICENSED",
  "packageManager": "pnpm@10.34.3",
  "engines": { "node": ">=24 <25", "pnpm": ">=10 <11" },
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\" \"scripts/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main.js",
    "lint": "eslint \"{src,test,scripts}/**/*.ts\"",
    "typecheck": "tsc --noEmit",
    "test": "jest --runInBand",
    "test:e2e": "jest --config test/jest-e2e.json --runInBand"
  }
}
```

Run:

```bash
mise exec -- pnpm add @nestjs/common@^11 @nestjs/core@^11 @nestjs/platform-express@^11 reflect-metadata@^0.2 rxjs@^7
mise exec -- pnpm add -D @eslint/js@^9 @nestjs/cli@^11 @nestjs/testing@^11 @types/jest@^30 @types/node@^24 @types/supertest@^7 eslint@^9 eslint-config-prettier@^10 globals@^16 jest@^30 prettier@^3 source-map-support@^0.5 supertest@^7 ts-jest@^29 ts-node@^10 tsconfig-paths@^4 typescript@6.0.3 typescript-eslint@^8
```

Expected: `pnpm-lock.yaml` 생성, `package.json`의 TypeScript가 정확히 `6.0.3`

- [ ] **Step 3: TypeScript·NestJS·ESLint 설정을 작성한다**

`tsconfig.json`은 `module`/`moduleResolution`을 `nodenext`, `target`을 `ES2023`, `strict`를 `true`로 두고 Nest decorator 옵션을 켠다. `tsconfig.build.json`은 `test`, `dist`, `**/*.spec.ts`를 제외한다. `eslint.config.mjs`는 `typescript-eslint` strict preset과 Prettier 충돌 제거 설정을 사용한다.

- [ ] **Step 4: 실패하는 루트 모듈 테스트를 작성한다**

```ts
import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';

describe('AppModule', () => {
  it('compiles', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    expect(moduleRef).toBeDefined();
    await moduleRef.close();
  });
});
```

Run: `mise exec -- pnpm test -- src/app.module.spec.ts`
Expected: FAIL because `src/app.module.ts` does not exist

- [ ] **Step 5: 최소 NestJS bootstrap과 AppModule을 구현한다**

```ts
// src/app.module.ts
import { Module } from '@nestjs/common';

@Module({})
export class AppModule {}
```

```ts
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

void bootstrap();
```

- [ ] **Step 6: TypeScript 6 호환성을 확인한다**

Run: `mise exec -- pnpm test -- src/app.module.spec.ts && mise exec -- pnpm typecheck && mise exec -- pnpm build && mise exec -- pnpm lint`
Expected: 모두 exit code 0

- [ ] **Step 7: 골격을 커밋한다**

```bash
git add mise.toml package.json pnpm-lock.yaml nest-cli.json tsconfig.json tsconfig.build.json eslint.config.mjs .prettierrc .gitignore src
git commit -m "NestJS 프로젝트 기반 구성"
```

---

### Task 2: Zod 환경설정 모듈

**Files:**

- Create: `.env.example`
- Create: `src/config/env.schema.ts`
- Create: `src/config/env.schema.spec.ts`
- Create: `src/config/config.constants.ts`
- Create: `src/config/config.module.ts`
- Modify: `src/app.module.ts`
- Modify: `src/main.ts`

**Interfaces:**

- Produces: `parseEnv(input: NodeJS.ProcessEnv): Env`, `ENV` token, `Env` with `NODE_ENV`, `PORT`, `DATABASE_URL`
- Consumes: `AppModule` from Task 1

- [ ] **Step 1: Zod를 설치하고 실패하는 schema 테스트를 작성한다**

Run: `mise exec -- pnpm add dotenv@^17 zod@^4`

```ts
import { parseEnv } from './env.schema';

describe('parseEnv', () => {
  const databaseUrl =
    'postgresql://reservation:reservation@localhost:5432/reservation';

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
    expect(() =>
      parseEnv({ DATABASE_URL: databaseUrl, PORT: '70000' }),
    ).toThrow();
  });
});
```

Run: `mise exec -- pnpm test -- src/config/env.schema.spec.ts`
Expected: FAIL because `parseEnv` does not exist

- [ ] **Step 2: 최소 환경 schema를 구현한다**

```ts
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.url().refine((value) => value.startsWith('postgresql://'), {
    message: 'DATABASE_URL must use postgresql://',
  }),
});

export type Env = z.infer<typeof envSchema>;
export const parseEnv = (input: NodeJS.ProcessEnv): Env =>
  envSchema.parse(input);
```

Run: `mise exec -- pnpm test -- src/config/env.schema.spec.ts`
Expected: PASS

- [ ] **Step 3: global ConfigModule과 DI token을 구현한다**

```ts
// src/config/config.constants.ts
export const ENV = Symbol('ENV');
```

```ts
// src/config/config.module.ts
import 'dotenv/config';
import { Global, Module } from '@nestjs/common';
import { ENV } from './config.constants';
import { parseEnv } from './env.schema';

@Global()
@Module({
  providers: [{ provide: ENV, useFactory: () => parseEnv(process.env) }],
  exports: [ENV],
})
export class ConfigModule {}
```

`AppModule`은 `ConfigModule`을 import하고, `main.ts`는 `app.get<Env>(ENV).PORT`로 listen한다.

- [ ] **Step 4: 환경검증과 bootstrap을 검증한다**

Run: `DATABASE_URL=postgresql://reservation:reservation@localhost:5432/reservation mise exec -- pnpm test && DATABASE_URL=postgresql://reservation:reservation@localhost:5432/reservation mise exec -- pnpm typecheck`
Expected: PASS

- [ ] **Step 5: 환경설정 모듈을 커밋한다**

```bash
git add .env.example package.json pnpm-lock.yaml src/config src/app.module.ts src/main.ts
git commit -m "Zod 환경변수 검증 추가"
```

---

### Task 3: Drizzle 데이터베이스 모듈과 migration 기반

**Files:**

- Create: `src/database/database.constants.ts`
- Create: `src/database/database.types.ts`
- Create: `src/database/database.module.ts`
- Create: `src/database/database.module.spec.ts`
- Create: `src/database/schema/index.ts`
- Create: `drizzle.config.ts`
- Create: `drizzle/` generated baseline files
- Modify: `src/app.module.ts`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**

- Produces: `PG_POOL`, `DRIZZLE_DB`, `AppDatabase`, global `DatabaseModule`
- Consumes: `ENV: Env` from Task 2

- [ ] **Step 1: DB 의존성을 설치하고 실패하는 provider 테스트를 작성한다**

Run: `mise exec -- pnpm add drizzle-orm@^0.45 pg@^8 && mise exec -- pnpm add -D @types/pg@^8 drizzle-kit@^0.31`

```ts
import { Test } from '@nestjs/testing';
import { Pool } from 'pg';
import { ConfigModule } from '../config/config.module';
import { ENV } from '../config/config.constants';
import type { Env } from '../config/env.schema';
import { DRIZZLE_DB, PG_POOL } from './database.constants';
import { DatabaseModule } from './database.module';

describe('DatabaseModule', () => {
  it('provides one pool and one Drizzle database and closes the pool', async () => {
    const endSpy = jest
      .spyOn(Pool.prototype, 'end')
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

    expect(moduleRef.get(PG_POOL)).toBeInstanceOf(Pool);
    expect(moduleRef.get(DRIZZLE_DB)).toBeDefined();
    await moduleRef.close();
    expect(endSpy).toHaveBeenCalledTimes(1);
  });
});
```

Run: `DATABASE_URL=postgresql://reservation:reservation@localhost:5432/reservation mise exec -- pnpm test -- src/database/database.module.spec.ts`
Expected: FAIL because `DatabaseModule` does not exist

- [ ] **Step 2: token과 DB 타입을 작성한다**

```ts
// src/database/database.constants.ts
export const PG_POOL = Symbol('PG_POOL');
export const DRIZZLE_DB = Symbol('DRIZZLE_DB');
```

```ts
// src/database/database.types.ts
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from './schema';

export type AppDatabase = NodePgDatabase<typeof schema>;
```

- [ ] **Step 3: pool과 Drizzle provider를 구현한다**

`DatabaseModule`은 `ENV`를 주입받아 `new Pool({ connectionString: env.DATABASE_URL })`을 만들고, `drizzle(pool, { schema })`를 `DRIZZLE_DB`로 제공한다. module destroy hook을 가진 전용 `DatabaseLifecycle` provider가 정확히 한 번 `pool.end()`를 호출한다. `PG_POOL`과 `DRIZZLE_DB`만 export한다.

- [ ] **Step 4: Drizzle Kit 설정과 명령을 작성한다**

```ts
// drizzle.config.ts
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { parseEnv } from './src/config/env.schema';

const env = parseEnv(process.env);

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema/index.ts',
  out: './drizzle',
  dbCredentials: { url: env.DATABASE_URL },
});
```

`package.json`에 다음을 추가한다.

```json
{
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:studio": "drizzle-kit studio"
}
```

Run: `DATABASE_URL=postgresql://reservation:reservation@localhost:5432/reservation mise exec -- pnpm db:generate --custom --name=phase-1-baseline`
Expected: `drizzle/`에 Drizzle Kit가 관리하는 빈 custom baseline migration과 metadata 생성

- [ ] **Step 5: 모듈과 설정을 검증한다**

Run: `DATABASE_URL=postgresql://reservation:reservation@localhost:5432/reservation mise exec -- pnpm test -- src/database/database.module.spec.ts && DATABASE_URL=postgresql://reservation:reservation@localhost:5432/reservation mise exec -- pnpm typecheck`
Expected: PASS

- [ ] **Step 6: DB 기반을 커밋한다**

```bash
git add package.json pnpm-lock.yaml drizzle.config.ts drizzle src/database src/app.module.ts
git commit -m "Drizzle 데이터베이스 모듈 구성"
```

---

### Task 4: Health API

**Files:**

- Create: `src/health/health.types.ts`
- Create: `src/health/health.service.ts`
- Create: `src/health/health.service.spec.ts`
- Create: `src/health/health.controller.ts`
- Create: `src/health/health.module.ts`
- Modify: `src/app.module.ts`

**Interfaces:**

- Produces: `GET /health`, `HealthResponse = { status: 'ok' | 'error'; database: 'up' | 'down' }`
- Consumes: `PG_POOL: Pool` from Task 3

- [ ] **Step 1: 실패하는 HealthService 테스트를 작성한다**

```ts
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
```

Run: `DATABASE_URL=postgresql://reservation:reservation@localhost:5432/reservation mise exec -- pnpm test -- src/health/health.service.spec.ts`
Expected: FAIL because `HealthService` does not exist

- [ ] **Step 2: timeout이 있는 HealthService를 구현한다**

`pool.query({ text: 'SELECT 1', query_timeout: 1_000 })`를 실행한다. 성공 시 `{ status: 'ok', database: 'up' }`, 실패 시 `ServiceUnavailableException({ status: 'error', database: 'down' })`을 던진다. 원래 오류 메시지를 응답에 넣지 않는다.

- [ ] **Step 3: controller와 module을 구현한다**

```ts
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  check(): Promise<HealthResponse> {
    return this.healthService.check();
  }
}
```

`HealthModule`은 controller와 service를 등록하고 `AppModule`에서 import한다.

- [ ] **Step 4: 단위 테스트와 정적 검증을 실행한다**

Run: `DATABASE_URL=postgresql://reservation:reservation@localhost:5432/reservation mise exec -- pnpm test -- src/health/health.service.spec.ts && DATABASE_URL=postgresql://reservation:reservation@localhost:5432/reservation mise exec -- pnpm typecheck && DATABASE_URL=postgresql://reservation:reservation@localhost:5432/reservation mise exec -- pnpm lint`
Expected: PASS

- [ ] **Step 5: Health API를 커밋한다**

```bash
git add src/health src/app.module.ts
git commit -m "데이터베이스 상태 확인 API 추가"
```

---

### Task 5: PostgreSQL Compose, 안전한 DB 재생성, E2E

**Files:**

- Create: `compose.yaml`
- Create: `docker/postgres/init/01-create-test-database.sql`
- Create: `scripts/reset-local-databases.ts`
- Create: `scripts/reset-local-databases.spec.ts`
- Create: `test/jest-e2e.json`
- Create: `test/health.e2e-spec.ts`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**

- Produces: PostgreSQL dev DB `reservation`, test DB `reservation_test`, `pnpm db:reset`, real `/health` E2E
- Consumes: `GET /health`, `PG_POOL`, `AppModule`

- [ ] **Step 1: PostgreSQL Compose와 테스트 DB 초기화를 작성한다**

`compose.yaml`은 `postgres:17-alpine`, 포트 `5432`, named volume, `pg_isready -U reservation -d reservation` healthcheck를 사용한다. 초기화 SQL은 `reservation_test` DB를 생성하고 `reservation` 사용자에게 소유권을 준다.

Run: `docker compose config`
Expected: exit code 0이며 `postgres` service와 named volume 표시

- [ ] **Step 2: DB reset 안전 조건의 실패 테스트를 작성한다**

`assertLocalResetAllowed(env: Env): void`가 다음을 거부하도록 테스트한다.

```ts
expect(() =>
  assertLocalResetAllowed({ ...validEnv, NODE_ENV: 'production' }),
).toThrow();
expect(() =>
  assertLocalResetAllowed({
    ...validEnv,
    DATABASE_URL: 'postgresql://u:p@db.example.com:5432/reservation',
  }),
).toThrow();
expect(() =>
  assertLocalResetAllowed({
    ...validEnv,
    DATABASE_URL: 'postgresql://u:p@localhost:5432/production',
  }),
).toThrow();
expect(() => assertLocalResetAllowed(validEnv)).not.toThrow();
```

허용 DB 이름은 `reservation`과 `reservation_test`, 허용 host는 `localhost`와 `127.0.0.1`로 제한한다.

Run: `DATABASE_URL=postgresql://reservation:reservation@localhost:5432/reservation mise exec -- pnpm test -- scripts/reset-local-databases.spec.ts`
Expected: FAIL because helper does not exist

- [ ] **Step 3: 안전한 reset script를 구현한다**

`assertLocalResetAllowed()`를 export하고, 직접 실행됐을 때만 `docker compose down --volumes` 후 `docker compose up --detach --wait`를 `spawnSync`로 실행한다. 각 command가 non-zero이면 그 exit code로 실패한다. `package.json`에 `"db:reset": "tsx scripts/reset-local-databases.ts"`를 추가하고 `tsx`를 dev dependency로 설치한다.

Run: `DATABASE_URL=postgresql://reservation:reservation@localhost:5432/reservation mise exec -- pnpm test -- scripts/reset-local-databases.spec.ts`
Expected: PASS

- [ ] **Step 4: 실제 DB를 준비하고 migration 재현성을 확인한다**

Run:

```bash
cp .env.example .env
docker compose up --detach --wait
DATABASE_URL=postgresql://reservation:reservation@localhost:5432/reservation mise exec -- pnpm db:migrate
DATABASE_URL=postgresql://reservation:reservation@localhost:5432/reservation mise exec -- pnpm db:reset
DATABASE_URL=postgresql://reservation:reservation@localhost:5432/reservation mise exec -- pnpm db:migrate
```

Expected: 두 번의 migration이 모두 성공하고 PostgreSQL container가 healthy

- [ ] **Step 5: 성공·실패 Health E2E 테스트를 작성한다**

성공 테스트는 실제 `reservation_test` DB를 사용해 `/health`가 200과 `{ status: 'ok', database: 'up' }`을 반환하는지 확인한다. 실패 테스트는 testing module에서 `PG_POOL`을 `{ query: jest.fn().mockRejectedValue(new Error('password=secret')) }`로 override하고 503 응답이 secret이나 stack을 포함하지 않는지 확인한다. 각 테스트는 Nest app을 `beforeAll`에서 열고 `afterAll`에서 닫는다.

Run: `DATABASE_URL=postgresql://reservation:reservation@localhost:5432/reservation_test NODE_ENV=test mise exec -- pnpm test:e2e`
Expected: PASS, one 200 case and one 503 case

- [ ] **Step 6: 전체 로컬 검증을 실행한다**

Run:

```bash
DATABASE_URL=postgresql://reservation:reservation@localhost:5432/reservation_test NODE_ENV=test mise exec -- pnpm lint
DATABASE_URL=postgresql://reservation:reservation@localhost:5432/reservation_test NODE_ENV=test mise exec -- pnpm typecheck
DATABASE_URL=postgresql://reservation:reservation@localhost:5432/reservation_test NODE_ENV=test mise exec -- pnpm test
DATABASE_URL=postgresql://reservation:reservation@localhost:5432/reservation_test NODE_ENV=test mise exec -- pnpm test:e2e
DATABASE_URL=postgresql://reservation:reservation@localhost:5432/reservation_test NODE_ENV=test mise exec -- pnpm build
```

Expected: 모두 exit code 0

- [ ] **Step 7: PostgreSQL과 E2E 기반을 커밋한다**

```bash
git add compose.yaml docker scripts test package.json pnpm-lock.yaml
git commit -m "PostgreSQL 개발 및 E2E 환경 구성"
```

---

### Task 6: CI와 README, Phase 1 완료 검증

**Files:**

- Create: `.github/workflows/ci.yml`
- Modify: `README.md`

**Interfaces:**

- Produces: pull request CI와 신규 개발자 실행 안내
- Consumes: Tasks 1~5의 모든 pnpm script와 PostgreSQL 연결 규칙

- [ ] **Step 1: GitHub Actions workflow를 작성한다**

workflow는 push와 pull request에서 실행하고 `postgres:17-alpine` service, `reservation_test` DB, healthcheck를 구성한다. `pnpm/action-setup`, `actions/setup-node`의 pnpm cache, `pnpm install --frozen-lockfile`을 사용한다. 환경에는 `NODE_ENV=test`, `DATABASE_URL=postgresql://reservation:reservation@localhost:5432/reservation_test`를 둔다.

검증 순서는 다음과 같다.

```yaml
- run: pnpm lint
- run: pnpm typecheck
- run: pnpm test
- run: pnpm db:migrate
- run: pnpm test:e2e
- run: pnpm build
```

- [ ] **Step 2: README를 Phase 1 실행 문서로 갱신한다**

다음 명령을 처음 실행하는 사람 기준으로 순서대로 적는다.

```bash
mise install
mise exec -- pnpm install --frozen-lockfile
cp .env.example .env
docker compose up --detach --wait
mise exec -- pnpm db:migrate
mise exec -- pnpm start:dev
curl http://localhost:3000/health
```

DB 재생성의 데이터 삭제 경고, `db:generate`, `db:migrate`, `db:studio`, lint/typecheck/unit/E2E/build 명령, TypeScript 6.0.3 호환성 검증 결과를 포함한다. 현재 단계를 Phase 1로 변경하되 Phase 0 문서 링크는 유지한다.

- [ ] **Step 3: 깨끗한 설치와 전체 검증을 실행한다**

Run:

```bash
mise install
mise exec -- pnpm install --frozen-lockfile
docker compose up --detach --wait
DATABASE_URL=postgresql://reservation:reservation@localhost:5432/reservation_test NODE_ENV=test mise exec -- pnpm db:migrate
DATABASE_URL=postgresql://reservation:reservation@localhost:5432/reservation_test NODE_ENV=test mise exec -- pnpm lint
DATABASE_URL=postgresql://reservation:reservation@localhost:5432/reservation_test NODE_ENV=test mise exec -- pnpm typecheck
DATABASE_URL=postgresql://reservation:reservation@localhost:5432/reservation_test NODE_ENV=test mise exec -- pnpm test
DATABASE_URL=postgresql://reservation:reservation@localhost:5432/reservation_test NODE_ENV=test mise exec -- pnpm test:e2e
DATABASE_URL=postgresql://reservation:reservation@localhost:5432/reservation_test NODE_ENV=test mise exec -- pnpm build
```

Expected: PostgreSQL healthy, migration·lint·typecheck·unit·E2E·build 모두 exit code 0

- [ ] **Step 4: CI와 문서를 커밋한다**

```bash
git add .github/workflows/ci.yml README.md
git commit -m "CI와 로컬 실행 문서 추가"
```

- [ ] **Step 5: Phase 1 완료 상태를 보고한다**

`git status --short`, `git log --oneline -6`, 전체 검증 결과를 확인한다. 기존에 추적되지 않았던 Phase 0 문서가 남아 있다면 사용자 소유 파일로 보존하고 임의로 포함하지 않는다. Phase 1 위키 체크 상태 갱신은 사용자가 별도로 요청할 때 `wiki-capture`로 수행한다.
