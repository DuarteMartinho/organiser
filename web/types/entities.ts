export type Group = {
    id: string;
    name: string;
    description?: string;
    privacy: 'public' | 'private';
    createdAt: Date;
};

export type GroupMember = {
    groupId: string;
    userId: string;
    joinedAt: Date;
};

export type GroupAdmin = {
    groupId: string;
    userId: string;
    createdAt: Date;
};

export type GroupBan = {
    id: string;
    groupId?: string;
    userId?: string;
    bannedBy?: string;
    reason?: string;
    createdAt: Date;
};

export type GroupInvite = {
    id: string;
    groupId?: string;
    createdBy?: string;
    code: string;
    maxUses?: number;
    usedCount?: number;
    expiresAt?: Date;
    isActive?: boolean;
    createdAt: Date;
};

export type Match = {
    id: string;
    groupId?: string;
    createdBy?: string;
    dateTime: Date;
    location?: string;
    maxPlayersPerTeam?: number;
    createdAt: Date;
    teamsCreated?: boolean;
    teamsFinalized?: boolean;
    plannedTeams?: number;
};

export type Team = {
    id: string;
    matchId?: string;
    name: string;
};

export type TeamPlayer = {
    id: string;
    userId?: string;
    groupId?: string;
    role: 'player' | 'admin';
    rating?: number;
    isKeyPlayer?: boolean;
    preferredPosition?: 'GK' | 'DEF' | 'MID' | 'FWD';
    createdAt: Date;
};

export type MatchPlayer = {
    id: string;
    teamId?: string;
    teamPlayerId?: string;
    guestName?: string;
    joinedAt: Date;
    matchId?: string;
};

export type MatchWaitingList = {
    id: string;
    matchId?: string;
    teamPlayerId?: string;
    joinedAt: Date;
};

export type PlayerMatchStats = {
    id: string;
    matchId?: string;
    teamPlayerId?: string;
    rating?: number;
    goals?: number;
    assists?: number;
    createdAt: Date;
};

export type Account = {
    id: string;
    userId: string;
    type: string;
    provider: string;
    providerAccountId: string;
    refreshToken?: string;
    accessToken?: string;
    expiresAt?: number;
    tokenType?: string;
    scope?: string;
    idToken?: string;
    sessionState?: string;
};

export type Session = {
    id: string;
    sessionToken: string;
    userId: string;
    expires: Date;
};

export type VerificationToken = {
    identifier: string;
    token: string;
    expires: Date;
};

export type User = {
    id: string;
    name: string;
    email: string;
    joinedAt: Date;
};