import { pgTable, text, serial, timestamp, boolean, json, integer } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  avatar: text('avatar').default('avatar_1'),
  isVerified: boolean('is_verified').default(false),
  preferences: json('preferences').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Email verification tokens
export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false),
  createdAt: timestamp('created_at').defaultNow()
});

// Password reset tokens
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false),
  createdAt: timestamp('created_at').defaultNow()
});

// Favorites
export const favorites = pgTable('favorites', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  animeId: text('anime_id').notNull(),
  animeData: json('anime_data'),
  createdAt: timestamp('created_at').defaultNow()
});

// Watchlist
export const watchlist = pgTable('watchlist', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  animeId: text('anime_id').notNull(),
  status: text('status').default('watching'),
  animeData: json('anime_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Watch history
export const watchHistory = pgTable('watch_history', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  animeId: text('anime_id').notNull(),
  episodeId: text('episode_id').notNull(),
  episodeNumber: integer('episode_number'),
  progress: integer('progress').default(0),
  duration: integer('duration').default(0),
  completed: boolean('completed').default(false),
  watchedAt: timestamp('watched_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow()
});

// Daily signup counter
export const dailySignups = pgTable('daily_signups', {
  id: serial('id').primaryKey(),
  date: text('date').notNull().unique(),
  count: integer('count').default(0),
  createdAt: timestamp('created_at').defaultNow()
});
