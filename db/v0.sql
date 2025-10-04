-- =========================
-- 1. Users
-- =========================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    joined_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- 2. Groups
-- =========================
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    privacy VARCHAR(10) NOT NULL DEFAULT 'private', -- public/private
    created_at TIMESTAMP DEFAULT NOW()
);

-- Many-to-many: group admins
CREATE TABLE group_admins (
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY(group_id, user_id)
);

-- Many-to-many: group members
CREATE TABLE group_members (
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY(group_id, user_id)
);

-- =========================
-- 3. TeamPlayers (group-specific user profile)
-- =========================
CREATE TABLE team_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL DEFAULT 'player', -- player/admin
    rating INT DEFAULT 5, -- 1-10
    is_key_player BOOLEAN DEFAULT FALSE,
    preferred_position VARCHAR(10) DEFAULT 'MID', -- GK, DEF, MID, FWD
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, group_id)
);

-- =========================
-- 4. Matches
-- =========================
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    date_time TIMESTAMP NOT NULL,
    location VARCHAR(255),
    max_players_per_team INT DEFAULT 11,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- 5. Teams (within a match)
-- =========================
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL -- Team A, Team B, etc.
);

-- =========================
-- 6. MatchPlayers
-- =========================
CREATE TABLE match_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    team_player_id UUID REFERENCES team_players(id) ON DELETE SET NULL, -- null for guests
    guest_name VARCHAR(100),
    joined_at TIMESTAMP DEFAULT NOW(),
    CHECK (
        (team_player_id IS NOT NULL AND guest_name IS NULL) OR
        (team_player_id IS NULL AND guest_name IS NOT NULL)
    )
);

-- =========================
-- 7. Waiting List
-- =========================
CREATE TABLE match_waiting_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    team_player_id UUID REFERENCES team_players(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(match_id, team_player_id)
);

-- =========================
-- 8. Analytics tables
-- =========================
CREATE TABLE player_match_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    team_player_id UUID REFERENCES team_players(id) ON DELETE CASCADE,
    rating INT, -- optional: snapshot of rating for this match
    goals INT DEFAULT 0,
    assists INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
