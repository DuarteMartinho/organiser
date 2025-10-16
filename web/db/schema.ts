import { pgTable, uuid, text, timestamp, integer, boolean, varchar } from 'drizzle-orm/pg-core';

// Users Table
export const users = pgTable('users', {
    id: text('id').primaryKey(),
    name: varchar('name').notNull(),
    email: varchar('email').notNull().unique(),
    emailVerified: boolean('email_verified').default(false),
    image: text('image'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    // Legacy field for backward compatibility
    joinedAt: timestamp('joined_at').defaultNow(),
});

// Groups Table
export const groups = pgTable('groups', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name').notNull(),
    description: text('description'),
    privacy: varchar('privacy').default('private').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

// Group Members Table
export const groupMembers = pgTable('group_members', {
    groupId: uuid('group_id').notNull().references(() => groups.id),
    userId: text('user_id').notNull().references(() => users.id),
    joinedAt: timestamp('joined_at').defaultNow(),
});

// Group Admins Table
export const groupAdmins = pgTable('group_admins', {
    groupId: uuid('group_id').notNull().references(() => groups.id),
    userId: text('user_id').notNull().references(() => users.id),
    createdAt: timestamp('created_at').defaultNow(),
});

// Group Bans Table
export const groupBans = pgTable('group_bans', {
    id: uuid('id').defaultRandom().primaryKey(),
    groupId: uuid('group_id').references(() => groups.id),
    userId: text('user_id').references(() => users.id),
    bannedBy: text('banned_by').references(() => users.id),
    reason: text('reason'),
    createdAt: timestamp('created_at').defaultNow(),
});

// Group Invites Table
export const groupInvites = pgTable('group_invites', {
    id: uuid('id').defaultRandom().primaryKey(),
    groupId: uuid('group_id').references(() => groups.id),
    createdBy: text('created_by').references(() => users.id),
    code: varchar('code').notNull().unique(),
    maxUses: integer('max_uses').default(1),
    usedCount: integer('used_count').default(0),
    expiresAt: timestamp('expires_at'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
});

// Matches Table
export const matches = pgTable('matches', {
    id: uuid('id').defaultRandom().primaryKey(),
    groupId: uuid('group_id').references(() => groups.id),
    createdBy: text('created_by').references(() => users.id),
    dateTime: timestamp('date_time').notNull(),
    location: varchar('location'),
    maxPlayersPerTeam: integer('max_players_per_team').default(11),
    createdAt: timestamp('created_at').defaultNow(),
    teamsCreated: boolean('teams_created').default(false),
    teamsFinalized: boolean('teams_finalized').default(false),
    plannedTeams: integer('planned_teams').default(2),
});

// Teams Table
export const teams = pgTable('teams', {
    id: uuid('id').defaultRandom().primaryKey(),
    matchId: uuid('match_id').references(() => matches.id),
    name: varchar('name').notNull(),
});

// Team Players Table
export const teamPlayers = pgTable('team_players', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').references(() => users.id),
    groupId: uuid('group_id').references(() => groups.id),
    role: varchar('role').default('player').notNull(),
    rating: integer('rating').default(5),
    isKeyPlayer: boolean('is_key_player').default(false),
    preferredPosition: varchar('preferred_position').default('MID'),
    createdAt: timestamp('created_at').defaultNow(),
});

// Match Players Table
export const matchPlayers = pgTable('match_players', {
    id: uuid('id').defaultRandom().primaryKey(),
    teamId: uuid('team_id').references(() => teams.id),
    teamPlayerId: uuid('team_player_id').references(() => teamPlayers.id),
    guestName: varchar('guest_name'),
    joinedAt: timestamp('joined_at').defaultNow(),
    matchId: uuid('match_id').references(() => matches.id),
});

// Match Waiting List Table
export const matchWaitingList = pgTable('match_waiting_list', {
    id: uuid('id').defaultRandom().primaryKey(),
    matchId: uuid('match_id').references(() => matches.id),
    teamPlayerId: uuid('team_player_id').references(() => teamPlayers.id),
    joinedAt: timestamp('joined_at').defaultNow(),
});

// Player Match Stats Table
export const playerMatchStats = pgTable('player_match_stats', {
    id: uuid('id').defaultRandom().primaryKey(),
    matchId: uuid('match_id').references(() => matches.id),
    teamPlayerId: uuid('team_player_id').references(() => teamPlayers.id),
    rating: integer('rating'),
    goals: integer('goals').default(0),
    assists: integer('assists').default(0),
    createdAt: timestamp('created_at').defaultNow(),
});

// Accounts Table (Better Auth OAuth)
export const accounts = pgTable('accounts', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    expiresAt: timestamp('expires_at'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Sessions Table (Better Auth)
export const sessions = pgTable('sessions', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Verification Table (Better Auth)
export const verification = pgTable('verification', {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});