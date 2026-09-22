# Phase 3 요구사항 명세서: 스터디룸 관리와 조회 (Study Rooms)

## 1. 개요 및 목적

- **목적**: 관리자가 스터디룸을 등록·관리하고, 일반 사용자가 활성화된 스터디룸 목록과 상세 정보를 조회할 수 있도록 합니다.
- **핵심 가치**: 예약 기능(Phase 4)의 전제 조건인 **Room 관리·조회 기반**을 구축합니다. 가용 시간 조회는 예약 저장·생성 이후 [Phase 4](phase-4-reservations-and-availability.md)에서 구현합니다. 동시성 검증은 Phase 5, 대기열은 Phase 6에서 진행합니다.

---

## 2. 도메인 모델 및 데이터베이스

### Room 엔티티

| 필드명        | 타입           | 제약 조건 / 기본값              | 설명                                 |
| ------------- | -------------- | ------------------------------- | ------------------------------------ |
| `id`          | `uuid`         | PK, 기본값: `gen_random_uuid()` | 스터디룸 고유 식별자                 |
| `name`        | `varchar(100)` | NOT NULL                        | 스터디룸 이름 (예: "스터디룸 A")     |
| `description` | `text`         | NULLABLE                        | 스터디룸 설명 및 비치 물품 안내      |
| `capacity`    | `integer`      | NOT NULL, `>= 1`                | 수용 가능 인원 수                    |
| `isActive`    | `boolean`      | NOT NULL, 기본값: `true`        | 운영 활성화 여부 (Soft-Deactivation) |
| `createdAt`   | `timestamptz`  | NOT NULL, 기본값: `now()`       | 생성 시각 (UTC)                      |
| `updatedAt`   | `timestamptz`  | NOT NULL, 기본값: `now()`       | 수정 시각 (UTC)                      |

---

## 3. 핵심 비즈니스 규칙 및 운영 정책

1. **룸 비활성화(Deactivation) 규칙**:
   - 물리 삭제(Hard Delete) 대신 `isActive: false`로 처리합니다.
   - 비활성화된 방은 일반 사용자 목록에 노출되지 않아야 하며, 상세 조회에도 정한 접근 정책을 적용합니다.
2. **단계 경계**:
   - 운영 시간·예약 단위 정책, 시간대 처리와 예약 가능 시간 조회는 Phase 4에서 다룹니다.

---

## 4. API 엔드포인트 명세

### A. 관리자 전용 API (`@Roles('ADMIN')`)

| Method   | Path               | Request Body                                    | Response (성공)             | 설명                                  |
| -------- | ------------------ | ----------------------------------------------- | --------------------------- | ------------------------------------- |
| `POST`   | `/admin/rooms`     | `{ name, description?, capacity }`              | `201 Created` (Room 객체)   | 스터디룸 신규 등록                    |
| `PATCH`  | `/admin/rooms/:id` | `{ name?, description?, capacity?, isActive? }` | `200 OK` (수정된 Room 객체) | 스터디룸 정보 수정                    |
| `DELETE` | `/admin/rooms/:id` | None                                            | `204 No Content`            | 스터디룸 비활성화 (`isActive: false`) |

### B. 사용자 공용/인증 API

| Method | Path                      | Query Params      | Response (성공)                                  | 설명                                                     |
| ------ | ------------------------- | ----------------- | ------------------------------------------------ | -------------------------------------------------------- |
| `GET`  | `/rooms`                  | `page=1&limit=10` | `200 OK` `{ items: Room[], total, page, limit }` | 활성 상태(`isActive: true`) 스터디룸 목록 (페이지네이션) |
| `GET`  | `/rooms/:id`              | None              | `200 OK` (Room 객체)                             | 스터디룸 상세 정보 조회                                  |

---

## 5. 예외 및 에러 응답

| 상황                                               | HTTP Code | Error Code         | 메시지                          |
| -------------------------------------------------- | --------- | ------------------ | ------------------------------- |
| 입력값 검증 실패 (수용인원 < 1 등) | `400`     | `VALIDATION_ERROR` | "잘못된 입력값입니다."          |
| 토큰 없이 접근하거나 유효하지 않은 토큰            | `401`     | `UNAUTHENTICATED`  | "인증이 필요합니다."            |
| 일반 사용자가 관리자 룸 생성/수정/삭제 시도        | `403`     | `FORBIDDEN`        | "접근 권한이 없습니다."         |
| 존재하지 않는 방 ID 요청                           | `404`     | `ROOM_NOT_FOUND`   | "존재하지 않는 스터디룸입니다." |
| 비활성화된 방에 상세 조회 요청 시             | `422`     | `ROOM_INACTIVE`    | "비활성화된 스터디룸입니다."    |

---

## 6. 개발 체크리스트

- [ ] **Step 1: Room 도메인 & DB 구성**
  - [ ] `Room` 엔티티 및 `RoomRepository` 포트 작성
  - [ ] Drizzle ORM `rooms` 테이블 스키마 작성 및 마이그레이션 생성
  - [ ] `DrizzleRoomRepository` 구현 및 단위/통합 테스트
- [ ] **Step 2: 관리자 룸 관리 API**
  - [ ] `CreateRoomUseCase`, `UpdateRoomUseCase`, `DeactivateRoomUseCase` 구현
  - [ ] `AdminRoomsController` (`@Roles('ADMIN')`) 구현 및 가드 테스트
- [ ] **Step 3: 사용자 룸 조회 API**
  - [ ] `GetRoomsUseCase` (페이지네이션/필터링) 및 `GetRoomDetailUseCase` 구현
  - [ ] `RoomsController` (`@Public()`) 구현 및 테스트
- [ ] **Step 4: 전체 테스트 및 린트/포맷 검증**
  - [ ] 단위/E2E 테스트 실행 (`pnpm test`, `pnpm test:e2e`)
  - [ ] `pnpm lint`, `pnpm format:check`, `pnpm typecheck` 통과

## 7. 완료 후 다음 단계

방 관리·조회 및 관련 테스트를 완료하면 [Phase 4](phase-4-reservations-and-availability.md)로 진행합니다. 가용 시간 조회는 Phase 3의 완료 조건에 포함하지 않습니다.
