'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'
import MatchDetails from './match-details'

interface Match {
  id: string
  date_time: string
  location: string | null
  max_players_per_team: number
  planned_teams: number
  teams_created: boolean
  teams_finalized: boolean
  created_at: string
  created_by: string
  teams?: Array<{ 
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

interface GroupMatchesProps {
  groupId: string
  isAdmin: boolean
  currentUserId: string
}

export default function GroupMatches({ 
  groupId, 
  isAdmin, 
  currentUserId
}: GroupMatchesProps) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null)
  const supabase = createClient()

  const fetchMatches = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
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
        .eq('group_id', groupId)
        .order('date_time', { ascending: false }) // Most recent first
        .limit(50) // Increased limit but still reasonable

      if (error) throw error
      setMatches(data || [])
    } catch (error) {
      console.error('Error fetching matches:', error)
      setMatches([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }, [groupId, supabase])

  useEffect(() => {
    let isMounted = true
    
    const loadMatches = async () => {
      if (isMounted) {
        await fetchMatches()
      }
    }
    
    loadMatches()
    
    return () => {
      isMounted = false
    }
  }, [groupId]) // Only depend on groupId, not fetchMatches

  const now = new Date()
  const upcomingMatches = matches.filter(match => new Date(match.date_time) > now).slice(0, 5)
  const pastMatches = matches.filter(match => new Date(match.date_time) <= now).slice(0, 5)

  if (loading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Matches</h3>
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Create Match Form */}
      {showCreateForm && (
        <CreateMatchForm 
          groupId={groupId}
          onSuccess={() => {
            setShowCreateForm(false)
            fetchMatches()
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Upcoming Matches */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Upcoming Matches</h3>
          {isAdmin && (
            <button 
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              + Create Match
            </button>
          )}
        </div>
        {upcomingMatches.length === 0 ? (
          <p className="text-gray-500 text-sm">No upcoming matches scheduled.</p>
        ) : (
          <div className="space-y-3">
            {upcomingMatches.map((match) => (
              <MatchCard 
                key={match.id} 
                match={match} 
                isUpcoming={true}
                onViewDetails={() => setSelectedMatchId(match.id)}
                currentUserId={currentUserId}
                groupId={groupId}
                onMatchUpdate={fetchMatches}
              />
            ))}
          </div>
        )}
      </div>

      {/* Past Matches */}
      {pastMatches.length > 0 && (
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Previous Matches</h3>
          <div className="space-y-3">
            {pastMatches.map((match) => (
              <MatchCard 
                key={match.id} 
                match={match} 
                isUpcoming={false}
                onViewDetails={() => setSelectedMatchId(match.id)}
                currentUserId={currentUserId}
                groupId={groupId}
                onMatchUpdate={fetchMatches}
              />
            ))}
          </div>
          {matches.filter(match => new Date(match.date_time) <= now).length > 5 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Showing recent 5 matches of {matches.filter(match => new Date(match.date_time) <= now).length} total
              </p>
            </div>
          )}
        </div>
      )}

      {/* Match Details Modal */}
      {selectedMatchId && (
        <MatchDetails
          matchId={selectedMatchId}
          onClose={() => setSelectedMatchId(null)}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          groupId={groupId}
        />
      )}
    </div>
  )
}

function MatchCard({ match, isUpcoming, onViewDetails, currentUserId, groupId, onMatchUpdate }: { 
  match: Match; 
  isUpcoming: boolean;
  onViewDetails: () => void;
  currentUserId: string;
  groupId: string;
  onMatchUpdate: () => void;
}) {
  const [loading, setLoading] = useState(false)
  const [userInMatch, setUserInMatch] = useState(false)
  const supabase = createClient()
  const matchDate = new Date(match.date_time)
  const isToday = matchDate.toDateString() === new Date().toDateString()
  const numberOfTeams = match.teams?.length || match.planned_teams
  const maxTotalPlayers = numberOfTeams * match.max_players_per_team
  const currentPlayers = match.match_players?.length || 0

  const checkUserInMatch = useCallback(async () => {
    if (!currentUserId || !groupId) return

    try {
      // Get current user's team_player record
      const { data: teamPlayerData } = await supabase
        .from('team_players')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('group_id', groupId)
        .single()

      if (!teamPlayerData) return

      // Check if user is in this match (either assigned to team or registered directly)
      const { data: matchPlayerData } = await supabase
        .from('match_players')
        .select('id')
        .eq('team_player_id', teamPlayerData.id)
        .eq('match_id', match.id)
        .single()

      setUserInMatch(!!matchPlayerData)
    } catch (error) {
      // User not in match
      setUserInMatch(false)
    }
  }, [currentUserId, groupId, match.id, supabase])

  useEffect(() => {
    checkUserInMatch()
  }, [checkUserInMatch])

  const handleJoinLeave = async () => {
    if (!currentUserId || !groupId) {
      alert('Please log in to join matches')
      return
    }

    setLoading(true)
    try {
      // Get current user's team_player record
      const { data: teamPlayerData, error: teamPlayerError } = await supabase
        .from('team_players')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('group_id', groupId)
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

        // Also remove from waiting list if they're on it
        await supabase
          .from('match_waiting_list')
          .delete()
          .eq('match_id', match.id)
          .eq('team_player_id', teamPlayerData.id)

        setUserInMatch(false)
        onMatchUpdate() // Refresh match data
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
              team_id: null // Will be assigned when teams are created
            })

          if (joinError) throw joinError
          
          setUserInMatch(true)
          onMatchUpdate() // Refresh match data
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
    } catch (error: any) {
      console.error('Error joining/leaving match:', error)
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`p-4 border rounded-md transition-colors ${
      isUpcoming 
        ? isToday 
          ? 'bg-green-50 border-green-200' 
          : 'hover:bg-gray-50'
        : 'bg-gray-50'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900">
              Football Match
            </h4>
            {isToday && (
              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                Today
              </span>
            )}
          </div>
          
          <div className="mt-1 space-y-1 text-sm text-gray-600">
            <p>📅 {matchDate.toLocaleDateString()} at {matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            {match.location && <p>📍 {match.location}</p>}
            <p>⚽ {numberOfTeams} teams planned, {match.max_players_per_team} players each</p>
            <p>👥 {currentPlayers}/{maxTotalPlayers} players registered</p>
            {match.teams_created ? (
              <p className="text-xs text-green-600">✓ Teams created</p>
            ) : (
              <p className="text-xs text-blue-600">Registration open</p>
            )}
            {match.teams_finalized && (
              <p className="text-xs text-purple-600">✓ Teams finalized</p>
            )}
            {numberOfTeams > 0 && (
              <p className="text-xs">
                Teams: {match.teams?.map(team => team.name).join(', ')}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={onViewDetails}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            View Details
          </button>
          {isUpcoming && !match.teams_finalized && (
            <button 
              onClick={handleJoinLeave}
              disabled={loading}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                userInMatch 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } disabled:bg-gray-400`}
            >
              {loading ? '...' : userInMatch ? 'Leave' : 'Join'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function CreateMatchForm({ 
  groupId, 
  onSuccess, 
  onCancel 
}: { 
  groupId: string
  onSuccess: () => void
  onCancel: () => void 
}) {
  const [dateTime, setDateTime] = useState('')
  const [location, setLocation] = useState('')
  const [maxPlayers, setMaxPlayers] = useState(11)
  const [numberOfTeams, setNumberOfTeams] = useState(2)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dateTime) return

    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create the match (teams will be created later by admins)
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .insert({
          group_id: groupId,
          created_by: user.id,
          date_time: dateTime,
          location: location || null,
          max_players_per_team: maxPlayers,
          planned_teams: numberOfTeams,
          teams_created: false,
          teams_finalized: false
        })
        .select()
        .single()

      if (matchError) throw matchError

      // Note: Teams are no longer created automatically
      // They will be created by admins when there are enough players

      onSuccess()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Create New Match</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="dateTime" className="block text-sm font-medium text-gray-700 mb-1">
            Date & Time *
          </label>
          <input
            type="datetime-local"
            id="dateTime"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            required
            min={new Date().toISOString().slice(0, 16)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Central Park Field 1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="numberOfTeams" className="block text-sm font-medium text-gray-700 mb-1">
              Number of Teams
            </label>
            <select
              id="numberOfTeams"
              value={numberOfTeams}
              onChange={(e) => setNumberOfTeams(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={2}>2 Teams</option>
              <option value={3}>3 Teams</option>
              <option value={4}>4 Teams</option>
              <option value={6}>6 Teams</option>
              <option value={8}>8 Teams</option>
            </select>
          </div>

          <div>
            <label htmlFor="maxPlayers" className="block text-sm font-medium text-gray-700 mb-1">
              Players per Team
            </label>
            <select
              id="maxPlayers"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={3}>3 players</option>
              <option value={4}>4 players</option>
              <option value={5}>5 players (5v5)</option>
              <option value={6}>6 players</option>
              <option value={7}>7 players (7v7)</option>
              <option value={8}>8 players</option>
              <option value={9}>9 players</option>
              <option value={10}>10 players</option>
              <option value={11}>11 players (Full)</option>
            </select>
          </div>
        </div>

        {/* Match Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="font-medium text-blue-900 mb-2">Match Setup Summary</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• <strong>{numberOfTeams} teams</strong> will be created</p>
            <p>• <strong>{maxPlayers} players per team</strong> (max capacity)</p>
            <p>• <strong>{numberOfTeams * maxPlayers} total spots</strong> available</p>
            <p>• Teams will be named: {Array.from({ length: numberOfTeams }, (_, i) => 
              `Team ${String.fromCharCode(65 + i)}`
            ).join(', ')}</p>
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading || !dateTime}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Creating...' : 'Create Match'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}