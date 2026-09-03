import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import {
  MAX_ROOM_CAPACITY,
  MIN_ROOM_CAPACITY,
} from '../../domains/rooms/domain/room.entity';
import { users } from './users';

export const rooms = pgTable(
  'rooms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    description: varchar('description', { length: 255 }).notNull(),
    capacity: integer('capacity').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      'rooms_capacity_check',
      sql`${table.capacity} BETWEEN ${sql.raw(
        String(MIN_ROOM_CAPACITY),
      )} AND ${sql.raw(String(MAX_ROOM_CAPACITY))}`,
    ),
  ],
);

export type RoomSelect = typeof rooms.$inferSelect;
export type RoomInsert = typeof rooms.$inferInsert;
