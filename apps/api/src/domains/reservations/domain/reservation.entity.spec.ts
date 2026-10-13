import { InvalidReservationTimeError } from './errors/invalid-reservation-time.error';
import { Reservation, type ReservationProps } from './reservation.entity';

describe('Reservation.create 시간 검증', () => {
  const now = new Date('2026-10-02T09:00:00+09:00');

  function createReservation(
    startsAt: string,
    endsAt: string,
    referenceTime: Date = now,
  ): Reservation {
    const props: ReservationProps = {
      id: 'reservation-1',
      userId: 'user-1',
      roomId: 'room-1',
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      status: 'CONFIRMED',
      cancelledByUserId: null,
      cancelledAt: null,
      createdAt: referenceTime,
      updatedAt: referenceTime,
    };

    return Reservation.create(props, referenceTime);
  }

  it.each([
    [
      '당일 미래 슬롯',
      '2026-10-02T10:00:00+09:00',
      '2026-10-02T11:00:00+09:00',
    ],
    [
      '운영 시작 슬롯',
      '2026-10-03T09:00:00+09:00',
      '2026-10-03T10:00:00+09:00',
    ],
    [
      '운영 마지막 슬롯',
      '2026-10-03T21:00:00+09:00',
      '2026-10-03T22:00:00+09:00',
    ],
    ['UTC로 표현한 서울 09시', '2026-10-03T00:00:00Z', '2026-10-03T01:00:00Z'],
    [
      '다른 offset으로 표현한 서울 09시',
      '2026-10-02T20:00:00-04:00',
      '2026-10-02T21:00:00-04:00',
    ],
    [
      '오늘부터 29일 뒤 마지막 슬롯',
      '2026-10-31T21:00:00+09:00',
      '2026-10-31T22:00:00+09:00',
    ],
  ])('%s을 허용한다', (_label, startsAt, endsAt) => {
    const reservation = createReservation(startsAt, endsAt);

    expect(reservation).toBeInstanceOf(Reservation);
    expect(reservation.startsAt).toEqual(new Date(startsAt));
    expect(reservation.endsAt).toEqual(new Date(endsAt));
  });

  it.each([
    [
      '시작 분이 0이 아닌 예약',
      '2026-10-03T09:30:00+09:00',
      '2026-10-03T10:30:00+09:00',
    ],
    [
      '시작 초가 0이 아닌 예약',
      '2026-10-03T09:00:01+09:00',
      '2026-10-03T10:00:01+09:00',
    ],
    [
      '시작 밀리초가 0이 아닌 예약',
      '2026-10-03T09:00:00.001+09:00',
      '2026-10-03T10:00:00.001+09:00',
    ],
    [
      '1시간보다 짧은 예약',
      '2026-10-03T09:00:00+09:00',
      '2026-10-03T09:59:59.999+09:00',
    ],
    [
      '1시간보다 긴 예약',
      '2026-10-03T09:00:00+09:00',
      '2026-10-03T10:00:00.001+09:00',
    ],
    ['2시간 예약', '2026-10-03T09:00:00+09:00', '2026-10-03T11:00:00+09:00'],
    [
      '시작과 종료가 같은 예약',
      '2026-10-03T09:00:00+09:00',
      '2026-10-03T09:00:00+09:00',
    ],
    [
      '종료가 시작보다 이른 예약',
      '2026-10-03T10:00:00+09:00',
      '2026-10-03T09:00:00+09:00',
    ],
    [
      '운영 시작 전 예약',
      '2026-10-03T08:00:00+09:00',
      '2026-10-03T09:00:00+09:00',
    ],
    [
      '운영 종료 후 예약',
      '2026-10-03T22:00:00+09:00',
      '2026-10-03T23:00:00+09:00',
    ],
    [
      '자정을 넘는 예약',
      '2026-10-03T23:00:00+09:00',
      '2026-10-04T00:00:00+09:00',
    ],
    [
      '현재 시각과 같은 시작',
      '2026-10-02T09:00:00+09:00',
      '2026-10-02T10:00:00+09:00',
    ],
    [
      '과거 날짜의 예약',
      '2026-10-01T09:00:00+09:00',
      '2026-10-01T10:00:00+09:00',
    ],
    [
      '오늘부터 30일 뒤 예약',
      '2026-11-01T09:00:00+09:00',
      '2026-11-01T10:00:00+09:00',
    ],
  ])('%s을 거부한다', (_label, startsAt, endsAt) => {
    expect(() => createReservation(startsAt, endsAt)).toThrow(
      InvalidReservationTimeError,
    );
  });

  it('시작 1밀리초 전에는 예약을 허용하고 1밀리초 후에는 거부한다', () => {
    const startsAt = '2026-10-02T10:00:00+09:00';
    const endsAt = '2026-10-02T11:00:00+09:00';
    const startMs = new Date(startsAt).getTime();

    expect(() =>
      createReservation(startsAt, endsAt, new Date(startMs - 1)),
    ).not.toThrow();
    expect(() =>
      createReservation(startsAt, endsAt, new Date(startMs + 1)),
    ).toThrow(InvalidReservationTimeError);
  });

  it('UTC 날짜가 바뀌기 전에도 서울 자정을 기준으로 예약 가능 기간이 바뀐다', () => {
    const startsAt = '2026-11-01T09:00:00+09:00';
    const endsAt = '2026-11-01T10:00:00+09:00';

    expect(() =>
      createReservation(startsAt, endsAt, new Date('2026-10-02T14:59:59.999Z')),
    ).toThrow(InvalidReservationTimeError);
    expect(() =>
      createReservation(startsAt, endsAt, new Date('2026-10-02T15:00:00Z')),
    ).not.toThrow();
  });

  it('예약 가능 기간은 현재부터 720시간이 아닌 서울 달력 날짜로 판단한다', () => {
    expect(() =>
      createReservation(
        '2026-11-01T09:00:00+09:00',
        '2026-11-01T10:00:00+09:00',
        new Date('2026-10-02T23:00:00+09:00'),
      ),
    ).toThrow(InvalidReservationTimeError);
  });

  it('연도를 넘어가도 오늘부터 29일 뒤까지만 허용한다', () => {
    const referenceTime = new Date('2026-12-20T09:00:00+09:00');

    expect(() =>
      createReservation(
        '2027-01-18T21:00:00+09:00',
        '2027-01-18T22:00:00+09:00',
        referenceTime,
      ),
    ).not.toThrow();
    expect(() =>
      createReservation(
        '2027-01-19T09:00:00+09:00',
        '2027-01-19T10:00:00+09:00',
        referenceTime,
      ),
    ).toThrow(InvalidReservationTimeError);
  });
});
