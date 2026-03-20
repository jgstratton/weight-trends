import { pgTable, uuid, text, timestamp, numeric, date } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	email: text('email').notNull().unique(),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const sessions = pgTable('sessions', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const otpTokens = pgTable('otp_tokens', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	code: text('code').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	usedAt: timestamp('used_at')
});

export const weights = pgTable('weights', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	value: numeric('value', { precision: 6, scale: 2 }).notNull(),
	date: date('date').notNull(),
	notes: text('notes'),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const userSettings = pgTable('user_settings', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.unique()
		.references(() => users.id, { onDelete: 'cascade' }),
	targetWeight: numeric('target_weight', { precision: 6, scale: 2 }),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type OtpToken = typeof otpTokens.$inferSelect;
export type Weight = typeof weights.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
