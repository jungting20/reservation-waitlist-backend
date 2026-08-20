# Phase 3 요구사항 명세서: 스터디룸과 예약 가능 시간 (Study Room & Availability)

## 1. 개요 및 목적

- **목적**: 관리자가 스터디룸을 등록·관리하고, 일반 사용자가 활성화된 스터디룸 목록 및 **특정 날짜의 1시간 단위 예약 가능 슬롯(Availability)**을 조회할 수 있도록 합니다.
- **핵심 가치**: 예약/대기열 생성(Phase 4, 5)의 전제 조건인 **Room 도메인 기반과 시간 슬롯 계산 로직**을 안정적으로 구축합니다.

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

1. **운영 시간 및 슬롯 규칙**:
   - 운영 시간: 매일 **`09:00 ~ 22:00` (Asia/Seoul 기준)**
   - 슬롯 단위: **정확히 1시간 단위 정각 슬롯** (09:00~~10:00, 10:00~~11:00, ..., 21:00~22:00 총 13개 슬롯)
2. **시간대(Timezone) 원칙**:
   - **DB 저장**: 모든 시간은 `UTC` (`timestamptz`)로 저장
   - **API 통신**: ISO 8601 형식(`YYYY-MM-DDTHH:mm:ss+09:00`) 또는 날짜 쿼리(`YYYY-MM-DD`) 사용
3. **룸 비활성화(Deactivation) 규칙**:
   - 물리 삭제(Hard Delete) 대신 `isActive: false`로 처리합니다.
   - 비활성화된 방은 일반 사용자 목록/상세 조회 및 가용성 조회 시 접근이 차단되거나 비활성 상태 에러(`422 ROOM_INACTIVE`)를 반환합니다.
4. **가용성(Availability) 계산 규칙**:
   - 별도의 가용성 상태 컬럼을 두지 않고 **(운영 시간) - (이미 CONFIRMED된 예약) - (과거 지난 시간)**을 실시간 계산하여 도출합니다.
   - 이미 지난 과거 시간대 슬롯은 예약 불가(`isAvailable: false`)로 표시합니다.

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
| `GET`  | `/rooms/:id/availability` | `date=YYYY-MM-DD` | `200 OK` `{ date, roomId, slots: Slot[] }`       | 특정 일자의 1시간 단위 예약 가능 슬롯 조회               |

#### 📌 Availability 응답 예시 (`GET /rooms/:id/availability?date=2026-08-20`)

```json
{
  "roomId": "018f...",
  "date": "2026-08-20",
  "slots": [
    {
      "startsAt": "2026-08-20T09:00:00+09:00",
      "endsAt": "2026-08-20T10:00:00+09:00",
      "isAvailable": true
    },
    {
      "startsAt": "2026-08-20T10:00:00+09:00",
      "endsAt": "2026-08-20T11:00:00+09:00",
      "isAvailable": false
    }
  ]
}
```

---

## 5. 예외 및 에러 응답

| 상황                                               | HTTP Code | Error Code         | 메시지                          |
| -------------------------------------------------- | --------- | ------------------ | ------------------------------- |
| 입력값 검증 실패 (수용인원 < 1, 날짜 형식 오류 등) | `400`     | `VALIDATION_ERROR` | "잘못된 입력값입니다."          |
| 토큰 없이 접근하거나 유효하지 않은 토큰            | `401`     | `UNAUTHENTICATED`  | "인증이 필요합니다."            |
| 일반 사용자가 관리자 룸 생성/수정/삭제 시도        | `403`     | `FORBIDDEN`        | "접근 권한이 없습니다."         |
| 존재하지 않는 방 ID 요청                           | `404`     | `ROOM_NOT_FOUND`   | "존재하지 않는 스터디룸입니다." |
| 비활성화된 방에 가용성 조회 등 요청 시             | `422`     | `ROOM_INACTIVE`    | "비활성화된 스터디룸입니다."    |

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
- [ ] **Step 4: 예약 가능 시간대(Availability) 계산**
  - [ ] 날짜 기반 09:00~22:00 슬롯 생성 유틸리티/서비스
  - [ ] `GetRoomAvailabilityUseCase` (예약 현황과 비교하여 `isAvailable` 계산)
  - [ ] 과거 시간대 자동 비활성화 로직 검증
- [ ] **Step 5: 전체 테스트 및 린트/포맷 검증**
  - [ ] 단위/E2E 테스트 실행 (`pnpm test`, `pnpm test:e2e`)
  - [ ] `pnpm lint`, `pnpm format:check`, `pnpm typecheck` 통과
