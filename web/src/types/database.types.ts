export type Database = {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    name: string
                    email: string
                    joined_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    email: string
                    joined_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    email?: string
                    joined_at?: string
                }
            }
            groups: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    privacy: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    privacy?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    privacy?: string
                    created_at?: string
                }
            }
            group_admins: {
                Row: {
                    group_id: string
                    user_id: string
                }
                Insert: {
                    group_id: string
                    user_id: string
                }
                Update: {
                    group_id?: string
                    user_id?: string
                }
            }
            group_members: {
                Row: {
                    group_id: string
                    user_id: string
                    joined_at: string
                }
                Insert: {
                    group_id: string
                    user_id: string
                    joined_at?: string
                }
                Update: {
                    group_id?: string
                    user_id?: string
                    joined_at?: string
                }
            }
            team_players: {
                Row: {
                    id: string
                    user_id: string
                    group_id: string
                    role: string
                    rating: number
                    is_key_player: boolean
                    preferred_position: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    group_id: string
                    role?: string
                    rating?: number
                    is_key_player?: boolean
                    preferred_position?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    group_id?: string
                    role?: string
                    rating?: number
                    is_key_player?: boolean
                    preferred_position?: string
                    created_at?: string
                }
            }
            matches: {
                Row: {
                    id: string
                    group_id: string
                    created_by: string | null
                    date_time: string
                    location: string | null
                    max_players_per_team: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    group_id: string
                    created_by?: string | null
                    date_time: string
                    location?: string | null
                    max_players_per_team?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    group_id?: string
                    created_by?: string | null
                    date_time?: string
                    location?: string | null
                    max_players_per_team?: number
                    created_at?: string
                }
            }
            teams: {
                Row: {
                    id: string
                    match_id: string
                    name: string
                }
                Insert: {
                    id?: string
                    match_id: string
                    name: string
                }
                Update: {
                    id?: string
                    match_id?: string
                    name?: string
                }
            }
            match_players: {
                Row: {
                    id: string
                    team_id: string
                    team_player_id: string | null
                    guest_name: string | null
                    joined_at: string
                }
                Insert: {
                    id?: string
                    team_id: string
                    team_player_id?: string | null
                    guest_name?: string | null
                    joined_at?: string
                }
                Update: {
                    id?: string
                    team_id?: string
                    team_player_id?: string | null
                    guest_name?: string | null
                    joined_at?: string
                }
            }
            match_waiting_list: {
                Row: {
                    id: string
                    match_id: string
                    team_player_id: string
                    joined_at: string
                }
                Insert: {
                    id?: string
                    match_id: string
                    team_player_id: string
                    joined_at?: string
                }
                Update: {
                    id?: string
                    match_id?: string
                    team_player_id?: string
                    joined_at?: string
                }
            }
            player_match_stats: {
                Row: {
                    id: string
                    match_id: string
                    team_player_id: string
                    rating: number | null
                    goals: number
                    assists: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    match_id: string
                    team_player_id: string
                    rating?: number | null
                    goals?: number
                    assists?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    match_id?: string
                    team_player_id?: string
                    rating?: number | null
                    goals?: number
                    assists?: number
                    created_at?: string
                }
            }
        }
    }
}