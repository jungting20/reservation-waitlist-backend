import { sql } from 'drizzle-orm';
import {
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { rooms } from './rooms';
import { users } from './users';

export const reservationStatusEnum = pgEnum('reservation_status', [
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'EXPIRED',
]);

export const reservations = pgTable(
  'reservations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    roomId: uuid('room_id')
      .notNull()
      .references(() => rooms.id),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    status: reservationStatusEnum('status').notNull(),
    cancelledByUserId: uuid('cancelled_by_user_id').references(() => users.id),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('reservations_confirmed_room_slot_unique')
      .on(table.roomId, table.startsAt)
      .where(sql`${table.status} = 'CONFIRMED'`),
  ],
);

export type ReservationSelect = typeof reservations.$inferSelect;
export type ReservationInsert = typeof reservations.$inferInsert;
