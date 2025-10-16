'use client'

import { useState, useEffect, useCallback } from 'react'
import MatchDetails from './match-details'
import { fetchMatchesByGroupAction } from '@/actions/matches/fetch-matches-by-group'
import { createMatchAction } from '@/actions/matches/create-match'
import { checkUserInMatchAction } from '@/actions/match-players/check-user-in-match'
import { addMatchPlayerAction } from '@/actions/match-players/add-match-player'
import { deleteMatchPlayerAction } from '@/actions/match-players/delete-match-player'
import { getTeamPlayerAction } from '@/actions/team-players/get-team-player'
import { addToWaitingListAction } from '@/actions/match-waiting-list/add-to-waiting-list'
import { deleteFromWaitingListAction } from '@/actions/match-waiting-list/delete-waiting-list'
import { useToast } from '@/hooks/useToast'

interface Match {
  id: string
  dateTime: Date | string
  location: string | null
  maxPlayersPerTeam: number | null
  plannedTeams: number | null
  teamsCreated: boolean | null
  teamsFinalized: boolean | null
  createdAt: Date | null
  createdBy: string | null
  groupId: string | null
  matchPlayers?: Array<{
    id: string
    teamPlayerId: string | null
    guestName: string | null
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
  const toast = useToast()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null)

  const fetchMatches = useCallback(async () => {
    try {
      const data = await fetchMatchesByGroupAction(groupId)
      setMatches(data)
    } catch (error) {
      console.error('Error fetching matches:', error)
      setMatches([])
    } finally {
      setLoading(false)
    }
  }, [groupId])

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
  }, [groupId])

  const now = new Date()
  const upcomingMatches = matches.filter(match => {
    const matchDate = match.dateTime instanceof Date ? match.dateTime : new Date(match.dateTime)
    return matchDate > now
  }).slice(0, 5)
  const pastMatches = matches.filter(match => {
    const matchDate = match.dateTime instanceof Date ? match.dateTime : new Date(match.dateTime)
    return matchDate <= now
  }).slice(0, 5)

  if (loading) {
    return (
      <div>
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
      <div>
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
        <div className="pt-6 border-t border-gray-200 mt-6">
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
          {matches.filter(match => {
            const matchDate = match.dateTime instanceof Date ? match.dateTime : new Date(match.dateTime)
            return matchDate <= now
          }).length > 5 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Showing recent 5 matches of {matches.filter(match => {
                  const matchDate = match.dateTime instanceof Date ? match.dateTime : new Date(match.dateTime)
                  return matchDate <= now
                }).length} total
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
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [userInMatch, setUserInMatch] = useState(false)
  const matchDate = match.dateTime instanceof Date ? match.dateTime : new Date(match.dateTime)
  const isToday = matchDate.toDateString() === new Date().toDateString()
  const numberOfTeams = match.plannedTeams || 2
  const maxTotalPlayers = numberOfTeams * (match.maxPlayersPerTeam || 11)
  const currentPlayers = match.matchPlayers?.length || 0

  const checkUserInMatch = useCallback(async () => {
    if (!currentUserId || !groupId) return

    try {
      const teamPlayer = await getTeamPlayerAction(currentUserId, groupId)
      if (!teamPlayer) {
        setUserInMatch(false)
        return
      }
      
      const isInMatch = await checkUserInMatchAction(teamPlayer.id, match.id)
      setUserInMatch(isInMatch)
    } catch (error) {
      setUserInMatch(false)
    }
  }, [currentUserId, groupId, match.id])

  useEffect(() => {
    checkUserInMatch()
  }, [checkUserInMatch])

  const handleJoinLeave = async () => {
    if (!currentUserId || !groupId) {
      toast.warning('Please log in to join matches')
      return
    }

    setLoading(true)
    try {
      const teamPlayer = await getTeamPlayerAction(currentUserId, groupId)
      if (!teamPlayer) {
        throw new Error('You must be a member of this group to join matches')
      }

      if (userInMatch) {
        // Leave match - remove from match_players
        await deleteMatchPlayerAction(teamPlayer.id, match.id)

        // Also remove from waiting list if they're on it
        await deleteFromWaitingListAction(match.id, teamPlayer.id)

        setUserInMatch(false)
        onMatchUpdate()
        toast.success('Successfully left the match!')
      } else {
        // Join match - check if there's space
        const totalSpots = (match.plannedTeams || 2) * (match.maxPlayersPerTeam || 11)
        const currentPlayers = match.matchPlayers?.length || 0
        
        if (currentPlayers < totalSpots) {
          // Space available - register directly to match
          await addMatchPlayerAction({
            matchId: match.id,
            teamPlayerId: teamPlayer.id,
            teamId: null,
            guestName: null
          })
          
          setUserInMatch(true)
          onMatchUpdate()
          toast.success('Successfully joined the match! You\'ll be assigned to a team when teams are created.')
        } else {
          // Match is full, join waiting list
          await addToWaitingListAction({
            matchId: match.id,
            teamPlayerId: teamPlayer.id
          })
          toast.info('Match is full! You have been added to the waiting list.')
        }
      }
    } catch (error: any) {
      console.error('Error joining/leaving match:', error)
      toast.error('Error: ' + error.message)
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
            <p>⚽ {numberOfTeams} teams planned, {match.maxPlayersPerTeam || 11} players each</p>
            <p>👥 {currentPlayers}/{maxTotalPlayers} players registered</p>
            {match.teamsCreated ? (
              <p className="text-xs text-green-600">✓ Teams created</p>
            ) : (
              <p className="text-xs text-blue-600">Registration open</p>
            )}
            {match.teamsFinalized && (
              <p className="text-xs text-purple-600">✓ Teams finalized</p>
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
          {isUpcoming && !match.teamsFinalized && (
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dateTime) return

    setLoading(true)
    setError('')

    try {
      const { authClient } = await import('@/lib/auth-client')
      const { data: session } = await authClient.getSession()
      if (!session?.user) throw new Error('Not authenticated')

      await createMatchAction({
        groupId,
        createdBy: session.user.id,
        dateTime: new Date(dateTime),
        location: location || null,
        maxPlayersPerTeam: maxPlayers,
        plannedTeams: numberOfTeams
      })

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