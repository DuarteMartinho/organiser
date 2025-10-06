import { pgTable, uuid, text, timestamp, integer, boolean, varchar } from 'drizzle-orm/pg-core';

// Users Table
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name').notNull(),
    email: varchar('email').notNull().unique(),
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
    userId: uuid('user_id').notNull().references(() => users.id),
    joinedAt: timestamp('joined_at').defaultNow(),
});

// Group Admins Table
export const groupAdmins = pgTable('group_admins', {
    groupId: uuid('group_id').notNull().references(() => groups.id),
    userId: uuid('user_id').notNull().references(() => users.id),
    createdAt: timestamp('created_at').defaultNow(),
});

// Group Bans Table
export const groupBans = pgTable('group_bans', {
    id: uuid('id').defaultRandom().primaryKey(),
    groupId: uuid('group_id').references(() => groups.id),
    userId: uuid('user_id').references(() => users.id),
    bannedBy: uuid('banned_by').references(() => users.id),
    reason: text('reason'),
    createdAt: timestamp('created_at').defaultNow(),
});

// Group Invites Table
export const groupInvites = pgTable('group_invites', {
    id: uuid('id').defaultRandom().primaryKey(),
    groupId: uuid('group_id').references(() => groups.id),
    createdBy: uuid('created_by').references(() => users.id),
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
    createdBy: uuid('created_by').references(() => users.id),
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
    userId: uuid('user_id').references(() => users.id),
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

// Accounts Table
export const accounts = pgTable('accounts', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    expiresAt: integer('expires_at'),
    tokenType: text('token_type'),
    scope: text('scope'),
    idToken: text('id_token'),
    sessionState: text('session_state'),
});

// Sessions Table
export const sessions = pgTable('sessions', {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionToken: text('session_token').notNull().unique(),
    userId: uuid('user_id').notNull().references(() => users.id),
    expires: timestamp('expires').notNull(),
});

// Verification Tokens Table
export const verificationTokens = pgTable('verificationtokens', {
    identifier: text('identifier').notNull(),
    token: text('token').notNull().unique(),
    expires: timestamp('expires').notNull(),
});