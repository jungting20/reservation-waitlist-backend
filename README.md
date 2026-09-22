# Reservation Waitlist

NestJS API와 Next.js 화면을 pnpm workspace로 관리하는 스터디룸 예약 및 대기열 학습 프로젝트입니다.

## 구조

- `apps/api`: 기존 NestJS 백엔드, DB 스키마·마이그레이션과 테스트
- `apps/web`: Next.js App Router 화면 (기본 화면과 서버 연결 확인)
- `docs`: 요구사항과 단계별 학습 문서
- `compose.yaml`, `docker/`: 공통 로컬 실행 환경

프런트엔드는 [Next.js 공식 설치 안내](https://nextjs.org/docs/app/getting-started/installation)를 기준으로 구성했습니다.

## 시작하기

필요한 도구는 [mise](https://mise.jdx.dev/) 및 Docker Compose입니다. 처음 실행할 때는 아래 순서를 따릅니다.

```bash
mise install
mise exec -- pnpm install --frozen-lockfile
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
docker compose up postgres --detach --wait
mise exec -- pnpm db:migrate
mise exec -- pnpm dev
curl http://localhost:18080/health
```

브라우저에서 `http://localhost:3000`을 열고 **연결 확인** 버튼을 누릅니다. API는 `http://localhost:18080`에서 실행됩니다. Next.js의 `/api/*` 요청은 `apps/web/.env.local`의 `API_URL`로 전달됩니다.

- `pnpm dev`: API와 웹 동시 실행
- `pnpm dev:api` / `pnpm dev:web`: 개별 실행
- `pnpm start:dev`: 기존 API 개발 명령 유지
- `docker compose up --build --detach --wait`: API와 DB를 컨테이너로 실행 (로컬 API와 포트 중복 실행 금지)

정상 상태에서 상태 확인 API는 `{"status":"ok","database":"up"}`을 반환합니다.

## 데이터베이스

- `mise exec -- pnpm db:generate`: 스키마 변경에서 Drizzle migration을 생성합니다.
- `mise exec -- pnpm db:migrate`: `apps/api/.env`의 `DATABASE_URL`에 아직 적용되지 않은 migration을 적용합니다.
- `mise exec -- pnpm db:studio`: Drizzle Studio를 실행합니다.
- `mise exec -- pnpm db:reset`: 로컬 PostgreSQL 컨테이너와 볼륨을 재생성합니다.

> **경고:** `db:reset`은 로컬 `reservation`과 `reservation_test` 데이터베이스의 모든 데이터를 삭제합니다.

## 품질 검증

```bash
mise exec -- pnpm lint
mise exec -- pnpm typecheck
mise exec -- pnpm test
DATABASE_URL=postgresql://reservation:reservation@localhost:5432/reservation_test NODE_ENV=test mise exec -- pnpm test:e2e
mise exec -- pnpm build
```

루트의 lint·typecheck·build는 전체 workspace를, test·test:e2e·db 명령은 API를 대상으로 실행합니다.

프로젝트는 TypeScript 6.0.3을 고정해 사용하며, lint·typecheck·unit test·E2E test·build 전체 검증으로 호환성을 확인합니다.

## 문서

- [요구사항](docs/requirements.md)
- [도메인 모델](docs/domain-model.md)
- [ERD](docs/erd.md)
- [API 초안](docs/api-draft.md)

## 핵심 정책

- 예약 단위: 1시간
- 예약 생성 즉시 확정
- 시작 10분 전까지만 사용자 취소 가능
- 동일 사용자의 겹치는 시간 예약·대기 금지
- 대기열은 선착순이며 취소 발생 시 1순위를 자동 승급
- 서비스 기준 시간대: Asia/Seoul, DB 저장: UTC
