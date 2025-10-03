import { pgTable, serial, text, timestamp, boolean, json, integer } from 'drizzle-orm/pg-core';

// Users table - matches existing schema with Discord auth
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').unique().notNull(),
  username: text('username').unique().notNull(),
  password: text('password'),
  avatar: text('avatar').default('1'),
  preferences: json('preferences').default({
    language: 'EN',
    autoPlay: false,
    autoNext: false,
    autoSkipIntro: false,
    theme: 'dark'
  }),
  isVerified: boolean('is_verified').default(false),
  // Discord OAuth fields
  discordId: text('discord_id').unique(),
  discordUsername: text('discord_username'),
  discordAvatar: text('discord_avatar'),
  discordAccessToken: text('discord_access_token'),
  discordRefreshToken: text('discord_refresh_token'),
  discordTokenExpiry: timestamp('discord_token_expiry'),
  authProvider: text('auth_provider').default('local'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Watch history - matches existing schema
export const watchHistory = pgTable('watch_history', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  animeId: text('anime_id').notNull(),
  episodeId: text('episode_id').notNull(),
  episodeNumber: integer('episode_number').notNull(),
  watchedAt: timestamp('watched_at').defaultNow(),
  progress: integer('progress').default(0),
  completed: boolean('completed').default(false)
});

// Favorites - matches existing schema
export const favorites = pgTable('favorites', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  animeId: text('anime_id').notNull(),
  title: text('title').notNull(),
  poster: text('poster'),
  addedAt: timestamp('added_at').defaultNow()
});

// Watchlist - matches existing schema
export const watchlist = pgTable('watchlist', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  animeId: text('anime_id').notNull(),
  title: text('title').notNull(),
  poster: text('poster'),
  status: text('status').default('plan_to_watch'),
  addedAt: timestamp('added_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Password reset tokens - matches existing schema
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  token: text('token').unique().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false),
  createdAt: timestamp('created_at').defaultNow()
});

// Email verification tokens - matches existing schema
export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  token: text('token').unique().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false),
  createdAt: timestamp('created_at').defaultNow()
});

// Daily signups counter - NEW table only
export const dailySignups = pgTable('daily_signups', {
  id: serial('id').primaryKey(),
  date: text('date').unique().notNull(),
  count: integer('count').default(0),
  createdAt: timestamp('created_at').defaultNow()
});

// Watch parties - existing table
export const watchParties = pgTable('watch_parties', {
  id: serial('id').primaryKey(),
  hostId: integer('host_id').references(() => users.id),
  animeId: text('anime_id').notNull(),
  episodeId: text('episode_id').notNull(),
  episodeNumber: integer('episode_number').notNull(),
  animeTitle: text('anime_title'),
  animePoster: text('anime_poster'),
  roomCode: text('room_code').unique().notNull(),
  status: text('status').default('waiting'),
  maxParticipants: integer('max_participants').default(10),
  isPublic: boolean('is_public').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at')
});

// Watch party participants - existing table
export const watchPartyParticipants = pgTable('watch_party_participants', {
  id: serial('id').primaryKey(),
  partyId: integer('party_id').references(() => watchParties.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id),
  joinedAt: timestamp('joined_at').defaultNow(),
  leftAt: timestamp('left_at'),
  isActive: boolean('is_active').default(true)
});
