# Football Match Organizer - Project Design

## 1. Entities / Models

### 1.1 User

- **id**: UUID
- **name**: string
- **email**: string
- **joined_at**: datetime

**Notes:**
- Users authenticate via SSO
- Roles are group-specific (no global user role)

### 1.2 Group

- **id**: UUID
- **name**: string
- **description**: string
- **privacy**: enum (public, private)
- **admins**: list of user IDs (from Users)
- **members**: list of user IDs (from Users)

**Notes:**
- A user can belong to multiple groups
- Public groups may appear on a map in a later phase

### 1.3 TeamPlayer (Group-Specific User Profile)

- **id**: UUID
- **user_id**: UUID (links to User)
- **group_id**: UUID (links to Group)
- **rating**: int (1–10, default 5) – visible only to admins
- **is_key_player**: boolean (default false)
- **preferred_position**: enum (GK, DEF, MID, FWD) or string
- **role**: enum (player, admin) – group-specific
- **created_at**: datetime

**Notes:**
- On joining a group, a TeamPlayer is created with defaults
- Only group admins can update rating, is_key_player, preferred_position

### 1.4 Match

- **id**: UUID
- **group_id**: UUID
- **date_time**: datetime
- **location**: string
- **max_players_per_team**: int (default 11)
- **created_by**: user_id (admin)
- **teams**: list of Team
- **waiting_list**: list of TeamPlayer

**Notes:**
- Supports multiple teams
- Players (including admins) can join matches
- Guests are persistent accounts, added to the group as TeamPlayer first
- Waiting list used when teams are full
- Later phase: automatic team balancing based on rating

### 1.5 Team

- **id**: UUID
- **match_id**: UUID
- **name**: string (e.g., "Team A")
- **players**: list of MatchPlayer

### 1.6 MatchPlayer

- **id**: UUID
- **team_id**: UUID
- **team_player_id**: UUID (nullable if guest)
- **joined_at**: datetime
- **guest_name**: string (if guest)

## 2. Permissions / Roles (Group-Specific)

| Role | Can Create Group | Can Add/Remove Players | Can Create Match | Can Add Guests | Can Join Matches | Can Edit Ratings & Key Player Info |
|------|------------------|------------------------|------------------|----------------|------------------|-----------------------------------|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Player | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

## 3. Features

### 3.1 Groups

- Users can create, join, leave, or browse groups
- Admins can manage members, roles, and privacy

### 3.2 Matches

- Admins create matches with multiple teams
- Players join/leave on first-come, first-served
- Admins can add guests (persistent group members)
- Full teams add players to a waiting list
- Later: automatic team balancing based on rating

### 3.3 Player Ratings

- Ratings are group-specific
- Only admins can see and edit ratings
- Rating is stored per group and per match optionally for analytics

### 3.4 TeamPlayer Defaults

On joining a group:
- **rating** = 5/10
- **is_key_player** = false
- **preferred_position** = MID

Only admins can update these values.

### 3.5 Analytics (Later Phase)

- Top-rated players per group
- Match participation history per player
- Most joined matches
- Average rating per match/team

## 4. API / Actions (High-Level)

### Users

- `GET /me` – Get current user info
- `POST /users` – Register (via SSO)
- `GET /groups` – List groups user belongs to

### Groups

- `POST /groups` – Create group
- `GET /groups/{id}` – Get group details
- `POST /groups/{id}/members` – Join group
- `DELETE /groups/{id}/members/{user_id}` – Remove member
- `PATCH /groups/{id}/admins` – Assign/remove admin

### TeamPlayers

- `GET /groups/{id}/teamplayers` – List team players (basic info for all, full info for admins)
- `PATCH /groups/{id}/teamplayers/{id}` – Update rating, key player, position (admins only)

### Matches

- `POST /groups/{id}/matches` – Create match
- `GET /matches/{id}` – Get match details
- `POST /matches/{id}/join` – Join match
- `POST /matches/{id}/leave` – Leave match
- `POST /matches/{id}/guests` – Add guest
- `GET /matches/{id}/waiting-list` – List waiting list

## 5. UI Ideas

- **Dashboard**: Groups, upcoming matches, notifications
- **Group Page**: Members, admins, team players, matches
- **Match Page**: Teams, players, join/leave, waiting list, add guests
- **Admin Panel**: Edit player ratings, key player, preferred position, manage members