# 도메인 모델

## 1. 주요 엔티티

### User

- `id`
- `email`
- `passwordHash`
- `role`: `USER | ADMIN`
- `createdAt`, `updatedAt`

### Room

- `id`
- `name`
- `description`
- `capacity`
- `isActive`
- `createdAt`, `updatedAt`

### Reservation

- `id`
- `userId`
- `roomId`
- `startsAt`
- `endsAt`
- `status`: `PENDING | CONFIRMED | CANCELLED | EXPIRED`
- `cancelledByUserId` (nullable)
- `cancelledAt` (nullable)
- `createdAt`, `updatedAt`

정책상 일반 예약은 즉시 `CONFIRMED`되므로 `PENDING`은 현재 MVP에서 사용하지 않는다. 향후 결제나 관리자 승인 도입을 위한 후보 상태로만 유지하며, 구현 시 불필요하면 제거한다.

### WaitlistEntry

- `id`
- `userId`
- `roomId`
- `startsAt`
- `endsAt`
- `status`: `WAITING | OFFERED | ACCEPTED | CANCELLED | EXPIRED`
- `acceptedReservationId` (nullable)
- `createdAt`, `updatedAt`

현재 정책은 1순위 자동 승급이므로 `OFFERED` 상태와 수락 제한시간은 사용하지 않는다. `WAITING → ACCEPTED`로 직접 전이한다. `OFFERED`와 `EXPIRED`는 수동 수락 정책을 도입할 때 사용할 후보 상태다.

## 2. Reservation 상태 전이

| 현재 상태 | 사건 | 다음 상태 | 허용 여부 |
|---|---|---|---|
| 없음 | 빈 시간대 예약 생성 | CONFIRMED | 허용 |
| PENDING | 승인 | CONFIRMED | MVP 미사용 |
| PENDING | 취소 | CANCELLED | MVP 미사용 |
| PENDING | 유효시간 만료 | EXPIRED | MVP 미사용 |
| CONFIRMED | 사용자가 시작 10분 전까지 취소 | CANCELLED | 허용 |
| CONFIRMED | 관리자가 강제 취소 | CANCELLED | 허용 |
| CONFIRMED | 시작 10분 이내 사용자 취소 | - | 금지 |
| CANCELLED | 재확정 | - | 금지 |
| EXPIRED | 재확정 | - | 금지 |

`CANCELLED`와 `EXPIRED`는 최종 상태다. 변경이 필요하면 기존 기록을 되살리지 않고 새 예약을 생성한다.

## 3. WaitlistEntry 상태 전이

| 현재 상태 | 사건 | 다음 상태 | 허용 여부 |
|---|---|---|---|
| 없음 | 예약된 시간대에 대기 등록 | WAITING | 허용 |
| WAITING | 사용자 또는 관리자 취소 | CANCELLED | 허용 |
| WAITING | 앞선 예약 취소로 자동 승급 | ACCEPTED | 허용 |
| WAITING | OFFERED로 전환 | OFFERED | MVP 미사용 |
| OFFERED | 사용자 수락 | ACCEPTED | MVP 미사용 |
| OFFERED | 제한시간 만료 | EXPIRED | MVP 미사용 |
| ACCEPTED | 다시 대기 상태로 복귀 | - | 금지 |
| CANCELLED | 재등록 처리 | - | 금지; 새 항목 생성 |
| EXPIRED | 수락 | - | 금지 |

## 4. 핵심 불변식

1. 예약의 `endsAt`은 `startsAt + 1시간`이다.
2. 예약 시작 시각은 `Asia/Seoul` 정책에서 정의한 1시간 경계에 맞아야 한다.
3. 동일한 `roomId + startsAt`에는 `CONFIRMED` 예약이 최대 하나다.
4. 한 사용자는 시간이 겹치는 `CONFIRMED` 예약을 둘 이상 가질 수 없다.
5. 한 사용자는 시간이 겹치는 활성 대기 항목을 둘 이상 가질 수 없다.
6. 한 사용자는 같은 시간에 활성 예약과 활성 대기를 동시에 가질 수 없다.
7. 대기는 이미 확정 예약이 있는 방과 시간대에만 등록할 수 있다.
8. 대기 순서는 `createdAt ASC, id ASC`로 결정한다.
9. 예약 취소와 첫 대기자의 승급은 하나의 트랜잭션에서 처리한다.
10. `ACCEPTED` 대기 항목은 정확히 하나의 새 예약을 참조한다.
11. 취소·승급 기록은 물리 삭제하지 않는다.
12. 사용자 취소는 `now < startsAt - 10분`일 때만 허용한다. 정확히 10분 전부터는 금지한다.
13. 관리자는 사용자 취소 제한을 우회할 수 있지만 감사 이력을 남겨야 한다.
14. 저장 시간은 UTC이며 표시와 입력 해석의 기준 시간대는 `Asia/Seoul`이다.

## 5. 자동 승급 트랜잭션

1. 취소할 예약을 잠근다.
2. 예약이 `CONFIRMED`인지 확인한다.
3. 예약을 `CANCELLED`로 변경한다.
4. 동일 방·시간의 첫 `WAITING` 항목을 `createdAt, id` 순으로 잠가 선택한다.
5. 대기 사용자가 같은 시간에 다른 활성 예약을 갖고 있지 않은지 다시 확인한다.
6. 새 `CONFIRMED` 예약을 생성한다.
7. 대기 항목을 `ACCEPTED`로 바꾸고 생성된 예약을 연결한다.
8. 전체 변경을 함께 커밋한다.

경합 처리의 구체적인 lock 및 DB 제약 전략은 Phase 5에서 검증한다.

## 6. 정책 선택의 이유

- 예약 가능 여부는 별도 boolean으로 저장하지 않고 방의 활성 상태, 운영 시간과 기존 예약을 조회해 계산한다. 중복된 파생 상태가 어긋나는 문제를 피하기 위함이다.
- 취소 기록은 운영 감사와 문제 조사에 필요하므로 보존한다.
- 대기 순서의 동률을 ID로 해소해 결과를 결정적으로 만든다.
- 사용자가 수락할 필요 없는 정책이므로 `OFFERED` 단계를 생략해 흐름을 단순화한다.
