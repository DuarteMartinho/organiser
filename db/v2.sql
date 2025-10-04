-- =========================
-- Football Dashboard Database Schema v2
-- =========================
-- This version includes updates for the new match workflow system
-- Changes from v1:
-- - Added teams_created and teams_finalized to matches table
-- - Modified match_players to include match_id for initial registration
-- - Made team_id nullable in match_players until teams are created

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
-- 4. Matches (Updated for v2 workflow)
-- =========================
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    date_time TIMESTAMP NOT NULL,
    location VARCHAR(255),
    max_players_per_team INT DEFAULT 11,
    planned_teams INT DEFAULT 2, -- NEW: planned number of teams for the match
    teams_created BOOLEAN DEFAULT FALSE, -- NEW: tracks if teams have been created
    teams_finalized BOOLEAN DEFAULT FALSE, -- NEW: tracks if teams are locked
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
-- 6. MatchPlayers (Updated for v2 workflow)
-- =========================
CREATE TABLE match_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE, -- NEW: direct match reference
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL, -- UPDATED: null until teams are created
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

-- =========================
-- 9. Indexes for Performance
-- =========================
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_admins_user_id ON group_admins(user_id);
CREATE INDEX idx_group_admins_group_id ON group_admins(group_id);
CREATE INDEX idx_team_players_user_id ON team_players(user_id);
CREATE INDEX idx_team_players_group_id ON team_players(group_id);
CREATE INDEX idx_matches_group_id ON matches(group_id);
CREATE INDEX idx_matches_date_time ON matches(date_time);
CREATE INDEX idx_match_players_match_id ON match_players(match_id);
CREATE INDEX idx_match_players_team_id ON match_players(team_id);
CREATE INDEX idx_match_players_team_player_id ON match_players(team_player_id);
CREATE INDEX idx_match_waiting_list_match_id ON match_waiting_list(match_id);
CREATE INDEX idx_match_waiting_list_team_player_id ON match_waiting_list(team_player_id);
CREATE INDEX idx_player_match_stats_match_id ON player_match_stats(match_id);
CREATE INDEX idx_player_match_stats_team_player_id ON player_match_stats(team_player_id);

-- =========================
-- 10. Migration Notes from v1 to v2
-- =========================
-- If migrating from v1, run these ALTER statements:

-- Add new columns to matches table:
-- ALTER TABLE matches ADD COLUMN teams_created BOOLEAN DEFAULT FALSE;
-- ALTER TABLE matches ADD COLUMN teams_finalized BOOLEAN DEFAULT FALSE;

-- Add match_id column to match_players table:
-- ALTER TABLE match_players ADD COLUMN match_id UUID REFERENCES matches(id) ON DELETE CASCADE;

-- Make team_id nullable in match_players (if not already):
-- ALTER TABLE match_players ALTER COLUMN team_id DROP NOT NULL;

-- Populate match_id for existing match_players:
-- UPDATE match_players 
-- SET match_id = teams.match_id 
-- FROM teams 
-- WHERE match_players.team_id = teams.id;

-- Create the new index:
-- CREATE INDEX idx_match_players_match_id ON match_players(match_id);

-- =========================
-- 11. Sample Data (Optional)
-- =========================
-- Uncomment to insert sample data for testing

/*
-- Sample users
INSERT INTO users (name, email) VALUES 
('John Doe', 'john@example.com'),
('Jane Smith', 'jane@example.com'),
('Mike Johnson', 'mike@example.com'),
('Sarah Wilson', 'sarah@example.com');

-- Sample group
INSERT INTO groups (name, description, privacy) VALUES 
('Weekend Warriors', 'Casual football group for weekend matches', 'private');

-- Sample group members (replace with actual UUIDs)
-- INSERT INTO group_members (group_id, user_id) 
-- SELECT g.id, u.id FROM groups g, users u WHERE g.name = 'Weekend Warriors';

-- Sample team players with varied ratings and positions
-- INSERT INTO team_players (user_id, group_id, rating, preferred_position, is_key_player)
-- SELECT u.id, g.id, 
--        CASE u.name 
--          WHEN 'John Doe' THEN 8
--          WHEN 'Jane Smith' THEN 7
--          WHEN 'Mike Johnson' THEN 6
--          WHEN 'Sarah Wilson' THEN 9
--        END,
--        CASE u.name 
--          WHEN 'John Doe' THEN 'FWD'
--          WHEN 'Jane Smith' THEN 'MID'
--          WHEN 'Mike Johnson' THEN 'DEF'
--          WHEN 'Sarah Wilson' THEN 'GK'
--        END,
--        CASE u.name 
--          WHEN 'Sarah Wilson' THEN TRUE
--          ELSE FALSE
--        END
-- FROM users u, groups g WHERE g.name = 'Weekend Warriors';
*/

-- =========================
-- 12. Constraints and Rules
-- =========================

-- Ensure rating is between 1 and 10
ALTER TABLE team_players ADD CONSTRAINT check_rating_range 
CHECK (rating >= 1 AND rating <= 10);

-- Ensure valid positions
ALTER TABLE team_players ADD CONSTRAINT check_valid_position 
CHECK (preferred_position IN ('GK', 'DEF', 'MID', 'FWD'));

-- Ensure valid privacy settings
ALTER TABLE groups ADD CONSTRAINT check_valid_privacy 
CHECK (privacy IN ('public', 'private'));

-- Ensure valid roles
ALTER TABLE team_players ADD CONSTRAINT check_valid_role 
CHECK (role IN ('player', 'admin'));

-- Ensure max_players_per_team is reasonable
ALTER TABLE matches ADD CONSTRAINT check_max_players_range 
CHECK (max_players_per_team >= 1 AND max_players_per_team <= 20);

-- Ensure teams_finalized cannot be true if teams_created is false
ALTER TABLE matches ADD CONSTRAINT check_teams_creation_order 
CHECK (NOT teams_finalized OR teams_created);

-- =========================
-- 13. Database Views (Optional)
-- =========================

-- View for active matches with team status
CREATE VIEW active_matches AS
SELECT 
    m.*,
    g.name as group_name,
    u.name as created_by_name,
    CASE 
        WHEN m.teams_finalized THEN 'Finalized'
        WHEN m.teams_created THEN 'Teams Created'
        ELSE 'Registration Open'
    END as match_status,
    COUNT(DISTINCT mp.id) as registered_players,
    COUNT(DISTINCT t.id) as team_count
FROM matches m
LEFT JOIN groups g ON m.group_id = g.id
LEFT JOIN users u ON m.created_by = u.id
LEFT JOIN match_players mp ON m.id = mp.match_id
LEFT JOIN teams t ON m.id = t.match_id
WHERE m.date_time > NOW()
GROUP BY m.id, g.name, u.name;

-- View for player statistics
CREATE VIEW player_stats AS
SELECT 
    tp.id,
    u.name,
    u.email,
    g.name as group_name,
    tp.rating,
    tp.preferred_position,
    tp.is_key_player,
    COUNT(DISTINCT mp.match_id) as matches_played,
    COALESCE(SUM(pms.goals), 0) as total_goals,
    COALESCE(SUM(pms.assists), 0) as total_assists
FROM team_players tp
JOIN users u ON tp.user_id = u.id
JOIN groups g ON tp.group_id = g.id
LEFT JOIN match_players mp ON tp.id = mp.team_player_id
LEFT JOIN player_match_stats pms ON tp.id = pms.team_player_id
GROUP BY tp.id, u.name, u.email, g.name, tp.rating, tp.preferred_position, tp.is_key_player;

-- =========================
-- End of Schema v2
-- =========================