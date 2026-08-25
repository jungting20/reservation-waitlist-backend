# Reservation Waitlist Backend

TypeScript와 NestJS로 구현하는 스터디룸 예약 및 대기열 백엔드 학습 프로젝트입니다.

현재 단계: Phase 1 — 프로젝트 기반, PostgreSQL, 상태 확인 API

## 시작하기

필요한 도구는 [mise](https://mise.jdx.dev/) 및 Docker Compose입니다. 처음 실행할 때는 아래 순서를 따릅니다.

```bash
mise install
mise exec -- pnpm install --frozen-lockfile
cp .env.example .env
docker compose up --detach --wait
mise exec -- pnpm db:migrate
mise exec -- pnpm start:dev
curl http://localhost:18080/health
```

정상 상태에서 상태 확인 API는 `{"status":"ok","database":"up"}`을 반환합니다.

## 데이터베이스

- `mise exec -- pnpm db:generate`: 스키마 변경에서 Drizzle migration을 생성합니다.
- `mise exec -- pnpm db:migrate`: `.env`의 `DATABASE_URL`에 아직 적용되지 않은 migration을 적용합니다.
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
