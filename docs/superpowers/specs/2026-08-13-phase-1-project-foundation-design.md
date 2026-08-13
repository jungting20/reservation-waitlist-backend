# Phase 1 프로젝트 기반 구성 설계

## 목적

NestJS와 PostgreSQL을 사용하는 예약·대기열 백엔드의 실행 기반을 만든다. 이 단계는 도메인 기능을 구현하지 않고, 이후 Phase에서 반복적으로 사용할 런타임·환경설정·데이터베이스·상태 확인·테스트·CI 기반만 제공한다.

## 범위

이번 작업에 포함한다.

- NestJS 11 애플리케이션 초기화
- mise를 통한 Node.js와 pnpm 버전 고정
- TypeScript 6.0.3 고정 및 NestJS 호환성 검증
- Docker Compose 기반 개발용 PostgreSQL
- Zod 기반 환경변수 파싱과 검증
- `pg.Pool` 기반 Drizzle ORM 연결
- Drizzle Kit migration 생성·적용·개발 DB 재생성 절차
- PostgreSQL 연결을 확인하는 `GET /health`
- lint, typecheck, unit test, E2E test
- GitHub Actions CI
- 로컬 실행 절차 문서화

인증, 사용자, 스터디룸, 예약, 대기열 schema와 API는 이후 Phase에서 구현한다.

## 도구 및 버전 정책

- Node.js: `24.18.0`
- pnpm: `10.34.3`
- TypeScript: `6.0.3`
- NestJS: 11.x
- PostgreSQL: 17 계열 Docker 이미지
- ORM: Drizzle ORM과 `node-postgres`
- 환경변수 검증: Zod

Node.js와 pnpm은 `mise.toml`에 고정한다. TypeScript는 `package.json`에 정확한 버전으로 기록한다. 나머지 JavaScript 의존성의 실제 해석 결과는 `pnpm-lock.yaml`로 재현한다.

TypeScript 6.0.3은 현재 NestJS 공식 저장소가 사용하는 버전보다 높으므로 `build`, `lint`, unit test와 E2E test를 모두 통과해야 채택이 완료된 것으로 본다.

## 애플리케이션 구조

```text
src/
  app.module.ts
  main.ts
  config/
    env.schema.ts
    env.schema.spec.ts
  database/
    database.constants.ts
    database.module.ts
    database.types.ts
    schema/
      index.ts
  health/
    health.controller.ts
    health.module.ts
    health.service.ts
test/
  health.e2e-spec.ts
  jest-e2e.json
docker/
  postgres/
    init/
      01-create-test-database.sql
drizzle/
compose.yaml
drizzle.config.ts
mise.toml
```

`ConfigModule`, `DatabaseModule`, `HealthModule`은 각자 한 책임만 가진다. 도메인 모듈은 `DatabaseModule`이 공개하는 Drizzle provider token을 주입받고, `pg.Pool` 생성 방식이나 환경변수 형식을 직접 알지 않는다.

## 환경설정

환경설정의 단일 입력은 다음 세 값이다.

- `NODE_ENV`: `development | test | production`, 기본값 `development`
- `PORT`: 양의 정수 포트, 기본값 `3000`
- `DATABASE_URL`: PostgreSQL 연결 URL, 필수

`src/config/env.schema.ts`는 `process.env`를 Zod로 파싱해 타입이 지정된 설정 객체를 반환한다. 필수 값이 없거나 형식이 잘못되면 NestJS가 포트를 열기 전에 읽을 수 있는 검증 오류와 함께 종료한다. 애플리케이션 코드에서는 검증 전의 `process.env`를 직접 읽지 않는다.

`.env.example`에는 로컬 개발용 예시만 두고 실제 비밀값은 커밋하지 않는다. 개발과 E2E는 서로 다른 데이터베이스 이름의 `DATABASE_URL`을 사용한다.

## 데이터베이스와 migration

`DatabaseModule`은 검증된 `DATABASE_URL`로 `pg.Pool`을 한 번 만들고, 그 pool을 사용하는 Drizzle 인스턴스를 provider로 등록한다. 애플리케이션 종료 시 pool을 정상 종료한다.

Drizzle schema는 `src/database/schema/`에서 모아 export한다. Phase 1에서는 도메인 테이블을 만들지 않는다. 최초 migration은 이후 첫 schema가 추가될 때 생성하며, 현재 단계에서는 Drizzle Kit 설정과 빈 DB 연결·migration 명령이 정상 동작하는지 검증한다.

서버 시작 시 migration을 자동 적용하지 않는다. 다음과 같이 운영 동작과 분리된 명령을 제공한다.

- `db:generate`: schema 변경으로 migration 파일 생성
- `db:migrate`: 보류 중인 migration 적용
- `db:studio`: Drizzle Studio 실행
- `db:reset`: 로컬·테스트 DB를 폐기하고 Compose로 다시 생성

Drizzle Kit는 일반적인 자동 `down` migration을 생성하지 않는다. 따라서 Phase 1의 “rollback”은 운영 DB에 역방향 SQL을 자동 실행한다는 뜻으로 구현하지 않고, 개발·테스트 환경에서 `db:reset` 후 migration을 처음부터 재적용하는 방식으로 검증한다. 운영 schema 변경의 forward-only 및 보상 migration 정책은 실제 schema가 생기는 Phase에서 별도로 결정한다.

`db:reset`은 `NODE_ENV=production`이거나 연결 대상이 로컬 Compose DB가 아니면 실행을 거부한다. 이 명령은 운영 환경의 rollback 수단으로 사용하지 않는다.

## 로컬 PostgreSQL

`compose.yaml`은 개발용 PostgreSQL 컨테이너, healthcheck, named volume을 정의한다. 초기화 SQL은 개발 DB와 별도의 테스트 DB를 만든다. 두 환경은 동일한 서버를 사용하되 데이터베이스 이름과 `DATABASE_URL`을 분리한다.

DB 준비 여부는 Docker healthcheck로 판단한다. CI에서는 service container로 PostgreSQL을 실행하고 테스트용 `DATABASE_URL`을 주입한다.

## Health API

`GET /health`는 다음을 수행한다.

1. 요청 시 Drizzle이 사용하는 pool로 `SELECT 1`을 실행한다.
2. 성공하면 HTTP 200과 `{ "status": "ok", "database": "up" }`를 반환한다.
3. 연결 실패나 timeout이면 HTTP 503과 `{ "status": "error", "database": "down" }`를 반환한다.

DB 점검에는 짧은 timeout을 적용해 health 요청이 무기한 대기하지 않게 한다. 오류 응답에는 비밀번호, 전체 연결 URL 또는 내부 stack trace를 포함하지 않는다.

## 테스트

- 환경설정 단위 테스트
  - 기본 `NODE_ENV`와 `PORT`
  - 유효한 `DATABASE_URL` 파싱
  - 누락되거나 잘못된 `DATABASE_URL` 거부
  - 잘못된 `PORT` 거부
- Health E2E 테스트
  - 준비된 PostgreSQL에서 200과 정상 응답 확인
  - DB provider가 실패할 때 503과 안전한 오류 응답 확인
- migration 검증
  - 빈 테스트 DB에 `db:migrate` 실행
  - `db:reset` 후 같은 명령을 다시 실행해 재현성 확인

완료 전 `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `pnpm build`를 모두 실행한다.

## CI

GitHub Actions는 Node.js 24와 pnpm을 사용하고 PostgreSQL service container를 시작한다. 순서는 dependency 설치, lint, typecheck, unit test, migration 적용, E2E test, build다. pnpm store를 캐시하되 lockfile 불일치가 있으면 설치를 실패시킨다.

## 문서화와 완료 조건

README에는 mise 설치 후 도구 활성화, 의존성 설치, 환경파일 준비, PostgreSQL 시작, migration, 개발 서버, 테스트 명령을 처음부터 순서대로 기록한다.

다음 조건을 모두 충족하면 Phase 1을 완료한다.

- `mise install`과 `pnpm install --frozen-lockfile`이 성공한다.
- `docker compose up -d` 후 PostgreSQL healthcheck가 통과한다.
- 잘못된 환경변수로 서버가 시작되지 않는다.
- 빈 DB와 재생성된 DB에서 migration 명령이 성공한다.
- `/health`가 DB 상태에 맞는 200 또는 503을 반환한다.
- lint, typecheck, unit test, E2E test와 build가 성공한다.
- README만 보고 새 환경에서 서버를 실행할 수 있다.
