'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { memoryMonitor } from '@/lib/memory-utils-temp'

interface DashboardMatch {
  id: string
  date_time: string
  location: string | null
  max_players_per_team: number
  planned_teams: number
  teams_created: boolean
  teams_finalized: boolean
  created_at: string
  created_by: string
  groups: {
    id: string
    name: string
  }
  teams: Array<{ 
    id: string; 
    name: string;
    match_players: Array<{
      id: string;
      team_player_id: string | null;
      guest_name: string | null;
    }>;
  }>
  match_players?: Array<{
    id: string;
    team_player_id: string | null;
    guest_name: string | null;
  }>
}

interface DashboardProps {
  currentUserId: string
}

export default function Dashboard({ currentUserId }: DashboardProps) {
  const [upcomingMatches, setUpcomingMatches] = useState<DashboardMatch[]>([])
  const [pastMatches, setPastMatches] = useState<DashboardMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [userGroups, setUserGroups] = useState<string[]>([])
  const supabase = createClient()

  const fetchUserGroups = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', currentUserId)

      if (error) throw error
      setUserGroups(data?.map((item: any) => item.group_id) || [])
    } catch (error) {
      console.error('Error fetching user groups:', error)
      setUserGroups([])
    }
  }, [currentUserId, supabase])

  const fetchMatches = useCallback(async () => {
    // Check memory before large operations
    if (memoryMonitor.checkUsage()) {
      console.warn('High memory usage detected before fetching matches')
      memoryMonitor.forceGC()
    }
    
    try {
      if (userGroups.length === 0) {
        // User has no groups, set empty arrays and stop loading
        setUpcomingMatches([])
        setPastMatches([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          groups (
            id,
            name
          ),
          teams (
            id,
            name,
            match_players (
              id,
              team_player_id,
              guest_name
            )
          ),
          match_players!match_id (
            id,
            team_player_id,
            guest_name
          )
        `)
        .in('group_id', userGroups)
        .order('date_time', { ascending: false })
        .limit(50)

      if (error) throw error

      const now = new Date()
      const upcoming = data?.filter((match: any) => new Date(match.date_time) > now) || []
      const past = data?.filter((match: any) => new Date(match.date_time) <= now) || []

      setUpcomingMatches(upcoming.slice(0, 10))
      setPastMatches(past.slice(0, 10))
    } catch (error) {
      console.error('Error fetching matches:', error)
      setUpcomingMatches([])
      setPastMatches([])
    } finally {
      setLoading(false)
    }
  }, [userGroups, supabase])

  const handleJoinLeave = async (match: DashboardMatch) => {
    // Prevent join/leave if teams are created or finalized
    if (match.teams_created || match.teams_finalized) {
      if (match.teams_finalized) {
        alert('Cannot join/leave - match teams are finalized!')
      } else {
        alert('Cannot join/leave - teams have been created!')
      }
      return
    }

    const userInMatch = await checkUserInMatch(match)

    try {
      // Get current user's team_player record
      const { data: teamPlayerData, error: teamPlayerError } = await supabase
        .from('team_players')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('group_id', match.groups.id)
        .single()

      if (teamPlayerError) throw teamPlayerError

      if (userInMatch) {
        // Leave match - remove from match_players
        const { error: leaveError } = await supabase
          .from('match_players')
          .delete()
          .eq('team_player_id', teamPlayerData.id)
          .eq('match_id', match.id)

        if (leaveError) throw leaveError

        // Also remove from waiting list
        await supabase
          .from('match_waiting_list')
          .delete()
          .eq('match_id', match.id)
          .eq('team_player_id', teamPlayerData.id)

        alert('Successfully left the match!')
      } else {
        // Join match - check if there's space
        const totalSpots = match.planned_teams * match.max_players_per_team
        const currentPlayers = match.match_players?.length || 0
        
        if (currentPlayers < totalSpots) {
          // Space available - register directly to match
          const { error: joinError } = await supabase
            .from('match_players')
            .insert({
              match_id: match.id,
              team_player_id: teamPlayerData.id,
              team_id: null,
              guest_name: null
            })

          if (joinError) throw joinError
          
          alert('Successfully joined the match! You\'ll be assigned to a team when teams are created.')
        } else {
          // Match is full, join waiting list
          const { error: waitingError } = await supabase
            .from('match_waiting_list')
            .insert({
              match_id: match.id,
              team_player_id: teamPlayerData.id
            })

          if (waitingError) throw waitingError
          alert('Match is full! You have been added to the waiting list.')
        }
      }

      fetchMatches() // Refresh data
    } catch (error: any) {
      console.error('Error joining/leaving match:', error)
      alert('Error: ' + error.message)
    }
  }

  useEffect(() => {
    if (currentUserId) {
      fetchUserGroups()
    }
  }, [currentUserId, fetchUserGroups])

  useEffect(() => {
    // Always call fetchMatches when userGroups changes (including when it becomes empty)
    fetchMatches()
  }, [userGroups, fetchMatches])

  const checkUserInMatch = async (match: DashboardMatch) => {
    try {
      // Get current user's team_player record for this group
      const { data: teamPlayerData } = await supabase
        .from('team_players')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('group_id', match.groups.id)
        .single()

      if (!teamPlayerData) return false

      // Check if user is in this match (either assigned to team or registered directly)
      const { data: matchPlayerData } = await supabase
        .from('match_players')
        .select('id')
        .eq('team_player_id', teamPlayerData.id)
        .eq('match_id', match.id)
        .single()

      return !!matchPlayerData
    } catch (error) {
      return false
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
          <p className="text-gray-500">Loading matches...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Matches */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Matches */}
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Upcoming Matches</h3>
                <a
                  href="/groups"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  View All
                </a>
              </div>
              {upcomingMatches.length === 0 ? (
                <div className="bg-white rounded-lg border shadow-sm p-6">
                  <p className="text-gray-500 text-center">No upcoming matches in your groups.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingMatches.map((match) => (
                    <DashboardMatchCard 
                      key={match.id} 
                      match={match} 
                      isUpcoming={true}
                      onJoinLeave={() => handleJoinLeave(match)}
                      currentUserId={currentUserId}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Past Matches */}
            {pastMatches.length > 0 && (
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Recent Matches</h3>
                  <a
                    href="/groups"
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    View All
                  </a>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pastMatches.map((match) => (
                    <DashboardMatchCard 
                      key={match.id} 
                      match={match} 
                      isUpcoming={false}
                      onJoinLeave={() => handleJoinLeave(match)}
                      currentUserId={currentUserId}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Groups */}
          <div className="space-y-6">
            <GroupsSection currentUserId={currentUserId} />
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardMatchCard({ 
  match, 
  isUpcoming, 
  onJoinLeave,
  currentUserId 
}: { 
  match: DashboardMatch; 
  isUpcoming: boolean;
  onJoinLeave: () => void;
  currentUserId: string;
}) {
  const [loading, setLoading] = useState(false)
  const [userInMatch, setUserInMatch] = useState(false)
  const supabase = createClient()
  
  const matchDate = new Date(match.date_time)
  const isToday = matchDate.toDateString() === new Date().toDateString()
  const numberOfTeams = match.teams?.length || match.planned_teams
  const totalSpots = numberOfTeams * match.max_players_per_team
  const currentPlayers = match.match_players?.length || 0
  const isLocked = match.teams_created || match.teams_finalized

  const checkUserInMatchLocal = useCallback(async () => {
    try {
      // Get current user's team_player record for this group
      const { data: teamPlayerData } = await supabase
        .from('team_players')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('group_id', match.groups.id)
        .single()

      if (!teamPlayerData) return

      // Check if user is in this match (v2 workflow)
      const { data: matchPlayerData } = await supabase
        .from('match_players')
        .select('id')
        .eq('team_player_id', teamPlayerData.id)
        .eq('match_id', match.id)
        .single()

      setUserInMatch(!!matchPlayerData)
    } catch (error) {
      setUserInMatch(false)
    }
  }, [currentUserId, match.groups.id, match.id, supabase])

  useEffect(() => {
    checkUserInMatchLocal()
  }, [checkUserInMatchLocal])

  const handleJoinLeave = async () => {
  setLoading(true)
  await onJoinLeave()
  await checkUserInMatchLocal() // Refresh status
  setLoading(false)
  }

  const getMatchStatus = () => {
    if (match.teams_finalized) return 'Finalized'
    if (match.teams_created) return 'Teams Created'
    return 'Registration Open'
  }

  const getButtonText = () => {
    if (loading) return '...'
    if (isLocked) return match.teams_finalized ? 'Finalized' : 'Teams Created'
    return userInMatch ? 'Leave' : 'Join'
  }

  return (
    <div className={`bg-white border rounded-lg p-4 transition-colors ${
      isUpcoming 
        ? isToday 
          ? 'border-green-200 bg-green-50' 
          : 'hover:bg-gray-50'
        : 'bg-gray-50'
    }`}>
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-gray-900">Football Match</h4>
          {isToday && (
            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
              Today
            </span>
          )}
          {userInMatch && isUpcoming && (
            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
              Joined
            </span>
          )}
          {isLocked && (
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              match.teams_finalized 
                ? 'bg-purple-100 text-purple-800'
                : 'bg-orange-100 text-orange-800'
            }`}>
              {getMatchStatus()}
            </span>
          )}
        </div>
        <p className="text-sm text-blue-600 font-medium">{match.groups.name}</p>
      </div>
      
      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <p>📅 {matchDate.toLocaleDateString()} at {matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        {match.location && <p>📍 {match.location}</p>}
        <p>⚽ {numberOfTeams} teams, {match.max_players_per_team} players each</p>
        <p>👥 {currentPlayers}/{totalSpots} spots</p>
      </div>

      <div className="flex gap-2">
        <a
          href={`/groups/${match.groups.id}`}
          className="flex-1 px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-center"
        >
          View Details
        </a>
        {isUpcoming && (
          <button 
            onClick={handleJoinLeave}
            disabled={loading || isLocked}
            className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
              isLocked
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : userInMatch 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:bg-gray-400`}
          >
            {getButtonText()}
          </button>
        )}
      </div>
    </div>
  )
}

// Groups Section Component
function GroupsSection({ currentUserId }: { currentUserId: string }) {
  const [userGroups, setUserGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchUserGroups = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          groups (
            id,
            name,
            description,
            privacy,
            created_at
          ),
          joined_at
        `)
        .eq('user_id', currentUserId)
        .order('joined_at', { ascending: false })

      if (error) throw error
      setUserGroups(data || [])
    } catch (error) {
      console.error('Error fetching user groups:', error)
      setUserGroups([])
    } finally {
      setLoading(false)
    }
  }, [currentUserId, supabase])

  useEffect(() => {
    fetchUserGroups()
  }, [fetchUserGroups])

  if (loading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Your Groups</h3>
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Your Groups</h3>
        <a
          href="/groups"
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          View All
        </a>
      </div>

      {userGroups.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-500 mb-4">You haven&apos;t joined any groups yet.</p>
          <a
            href="/groups"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            Browse Groups
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {userGroups.slice(0, 3).map((membership: any) => (
            <div key={membership.groups.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">
                    {membership.groups.name}
                  </h4>
                  {membership.groups.description && (
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {membership.groups.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                      membership.groups.privacy === 'public' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {membership.groups.privacy}
                    </span>
                  </div>
                </div>
                <a
                  href={`/groups/${membership.groups.id}`}
                  className="ml-3 px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  View
                </a>
              </div>
            </div>
          ))}
          
          {userGroups.length > 3 && (
            <div className="text-center pt-2">
                <a
                href="/groups"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View {userGroups.length - 3} more groups &rarr;
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}