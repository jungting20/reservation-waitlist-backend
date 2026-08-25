import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

export const rooms = pgTable('rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type RoomSelect = typeof rooms.$inferSelect;
export type RoomInsert = typeof rooms.$inferInsert;
