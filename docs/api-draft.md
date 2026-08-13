# API 초안

기준 시간대는 `Asia/Seoul`이며 시간 입력과 출력은 offset을 포함한 ISO 8601을 사용한다.

## 인증

| Method | Path | 설명 |
|---|---|---|
| POST | `/auth/signup` | 회원가입 |
| POST | `/auth/login` | 로그인과 access token 발급 |
| GET | `/users/me` | 내 정보 조회 |

## 관리자 스터디룸 API

| Method | Path | 설명 |
|---|---|---|
| POST | `/admin/rooms` | 방 생성 |
| PATCH | `/admin/rooms/:roomId` | 방 정보 수정 |
| DELETE | `/admin/rooms/:roomId` | 방 비활성화 |

## 사용자 스터디룸 API

| Method | Path | 설명 |
|---|---|---|
| GET | `/rooms` | 활성 방 목록 조회 |
| GET | `/rooms/:roomId` | 활성 방 상세 조회 |
| GET | `/rooms/:roomId/availability?date=YYYY-MM-DD` | 날짜별 1시간 예약 가능 시간 조회 |

## 예약 API

| Method | Path | 설명 |
|---|---|---|
| POST | `/reservations` | 빈 시간대 즉시 확정 예약 |
| GET | `/reservations/me` | 내 예약 목록 |
| GET | `/reservations/:reservationId` | 내 예약 상세 |
| POST | `/reservations/:reservationId/cancel` | 시작 10분 전까지 내 예약 취소 |
| POST | `/admin/reservations/:reservationId/cancel` | 관리자 강제 취소 |
| POST | `/admin/reservations/:reservationId/reschedule` | 관리자 예약 변경 초안 |

예약 생성 예시:

```json
{
  "roomId": "uuid",
  "startsAt": "2026-08-20T14:00:00+09:00"
}
```

성공: `201 Created`, 상태는 `CONFIRMED`.

## 대기열 API

| Method | Path | 설명 |
|---|---|---|
| POST | `/waitlists` | 예약된 시간대에 선착순 대기 등록 |
| GET | `/waitlists/me` | 내 대기 목록과 순번 조회 |
| GET | `/waitlists/:waitlistId` | 내 대기 상세와 순번 조회 |
| POST | `/waitlists/:waitlistId/cancel` | 내 대기 취소 |

대기 등록 예시:

```json
{
  "roomId": "uuid",
  "startsAt": "2026-08-20T14:00:00+09:00"
}
```

취소 발생 시 1순위는 자동 승급되므로 별도의 `/accept` API는 두지 않는다.

## 대표 에러 응답

```json
{
  "statusCode": 409,
  "code": "RESERVATION_TIME_CONFLICT",
  "message": "같은 시간에 이미 예약 또는 대기 중입니다.",
  "requestId": "uuid"
}
```

| HTTP | code | 상황 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | 형식 또는 필수 입력 오류 |
| 401 | `UNAUTHENTICATED` | 로그인 필요 또는 잘못된 토큰 |
| 403 | `FORBIDDEN` | 역할 또는 소유권 부족 |
| 404 | `ROOM_NOT_FOUND` | 방 없음 |
| 404 | `RESERVATION_NOT_FOUND` | 예약 없음 |
| 409 | `ROOM_SLOT_ALREADY_RESERVED` | 방과 시간대가 이미 예약됨 |
| 409 | `RESERVATION_TIME_CONFLICT` | 사용자의 다른 예약과 시간 중복 |
| 409 | `WAITLIST_TIME_CONFLICT` | 사용자의 다른 대기와 시간 중복 |
| 409 | `CANCELLATION_DEADLINE_PASSED` | 시작 10분 이내 사용자 취소 |
| 409 | `INVALID_STATE_TRANSITION` | 현재 상태에서 요청 불가 |
| 409 | `WAITLIST_NOT_AVAILABLE` | 빈 시간대에 대기 신청 |
| 422 | `ROOM_INACTIVE` | 비활성 방 대상 요청 |
| 422 | `PAST_TIME_SLOT` | 과거 시간대 요청 |

## 응답 원칙

- 생성 성공: 201
- 조회 성공: 200
- 취소 성공: 204
- 관리자 변경 성공: 200
- 내부 DB 제약조건 오류를 그대로 노출하지 않고 도메인 코드와 409로 변환한다.
