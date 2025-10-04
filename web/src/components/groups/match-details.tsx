'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'
import SearchableSelect from '@/components/ui/searchable-select'

interface MatchDetailsProps {
  matchId: string
  onClose: () => void
  isAdmin: boolean
  currentUserId: string
  groupId: string
}

interface Team {
  id: string
  name: string
  match_players: Array<{
    id: string
    team_player_id: string | null
    guest_name: string | null
    joined_at: string
    team_players?: {
      users: {
        id: string
        name: string
        email: string
      }
      rating: number
      preferred_position: string
      is_key_player: boolean
    }
  }>
}

interface MatchPlayer {
  id: string
  team_player_id: string | null
  guest_name: string | null
  joined_at: string
  team_players?: {
    users: {
      id: string
      name: string
      email: string
    }
    rating: number
    preferred_position: string
    is_key_player: boolean
  }
}

interface Match {
  id: string
  date_time: string
  location: string | null
  max_players_per_team: number
  planned_teams: number
  created_at: string
  created_by: string
  teams_created: boolean
  teams_finalized: boolean
  teams: Team[]
  match_players: MatchPlayer[]
}

interface WaitingListPlayer {
  id: string
  team_player_id: string
  joined_at: string
  team_players: {
    users: {
      id: string
      name: string
      email: string
    }
    rating: number
    preferred_position: string
    is_key_player: boolean
  }
}

export default function MatchDetails({ matchId, onClose, isAdmin, currentUserId, groupId }: MatchDetailsProps) {
  const [match, setMatch] = useState<Match | null>(null)
  const [waitingList, setWaitingList] = useState<WaitingListPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [showAddGuest, setShowAddGuest] = useState(false)
  const [showGuestModal, setShowGuestModal] = useState(false)
  const [selectedGuestMember, setSelectedGuestMember] = useState<string>('')
  const [availableMembers, setAvailableMembers] = useState<Array<{id: string, name: string, email: string}>>([])  
  const [creatingTeams, setCreatingTeams] = useState(false)
  const [finalizingTeams, setFinalizingTeams] = useState(false)
  const [randomizingTeams, setRandomizingTeams] = useState(false)
  const [deletingMatch, setDeletingMatch] = useState(false)
  const [addingGuest, setAddingGuest] = useState<string | null>(null) // Track which guest is being added
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchAvailableMembers = useCallback(async () => {
    try {
      // Get all group members
      const { data: allMembers, error: membersError } = await supabase
        .from('team_players')
        .select(`
          id,
          users (
            id,
            name,
            email
          )
        `)
        .eq('group_id', groupId)

      if (membersError) throw membersError

      // Get current match participants (both registered and in waiting list)
      const { data: matchParticipants, error: participantsError } = await supabase
        .from('match_players')
        .select('team_player_id')
        .eq('match_id', matchId)
        .not('team_player_id', 'is', null)

      if (participantsError) throw participantsError

      const { data: waitingParticipants, error: waitingError } = await supabase
        .from('match_waiting_list')
        .select('team_player_id')
        .eq('match_id', matchId)

      if (waitingError) throw waitingError

      // Filter out members who are already participating or on waiting list
      const participantIds = [
        ...(matchParticipants?.map((p: any) => p.team_player_id) || []),
        ...(waitingParticipants?.map((p: any) => p.team_player_id) || [])
      ]

      const available = allMembers?.filter((member: any) => 
        !participantIds.includes(member.id)
      ).map((member: any) => ({
        id: member.id,
        name: member.users.name,
        email: member.users.email
      })) || []

      setAvailableMembers(available)
    } catch (error) {
      console.error('Error fetching available members:', error)
    }
  }, [groupId, matchId, supabase])

  const fetchMatchDetails = useCallback(async () => {
    try {
      // Fetch match with teams and players
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select(`
          *,
          teams (
            id,
            name,
            match_players (
              id,
              team_player_id,
              guest_name,
              joined_at,
              team_players (
                users (
                  id,
                  name,
                  email
                ),
                rating,
                preferred_position,
                is_key_player
              )
            )
          ),
          match_players!match_id (
            id,
            team_player_id,
            guest_name,
            joined_at,
            team_players (
              users (
                id,
                name,
                email
              ),
              rating,
              preferred_position,
              is_key_player
            )
          )
        `)
        .eq('id', matchId)
        .single()

      if (matchError) throw matchError

      // Fetch waiting list
      const { data: waitingData, error: waitingError } = await supabase
        .from('match_waiting_list')
        .select(`
          id,
          team_player_id,
          joined_at,
          team_players (
            users (
              id,
              name,
              email
            ),
            rating,
            preferred_position,
            is_key_player
          )
        `)
        .eq('match_id', matchId)
        .order('joined_at', { ascending: true })

      if (waitingError) throw waitingError

      setMatch(matchData)

      // Normalize waitingData shape (Supabase may return nested arrays for joins)
      const normalizedWaiting: WaitingListPlayer[] = (waitingData || []).map((w: any) => {
        // team_players may come back as an array or object; normalize to a single object
        const rawTeamPlayers = w.team_players
        let tp: any = null

        if (Array.isArray(rawTeamPlayers)) {
          tp = rawTeamPlayers[0]
        } else if (rawTeamPlayers && Array.isArray(rawTeamPlayers.users)) {
          // some responses nest users as an array inside team_players
          tp = {
            users: rawTeamPlayers.users[0],
            rating: rawTeamPlayers.rating,
            preferred_position: rawTeamPlayers.preferred_position,
            is_key_player: rawTeamPlayers.is_key_player
          }
        } else {
          tp = rawTeamPlayers || null
        }

        const usersObj = tp?.users && Array.isArray(tp.users) ? tp.users[0] : tp?.users || { id: '', name: '', email: '' }

        return {
          id: w.id,
          team_player_id: w.team_player_id,
          joined_at: w.joined_at,
          team_players: {
            users: usersObj,
            rating: tp?.rating ?? 0,
            preferred_position: tp?.preferred_position ?? '',
            is_key_player: !!tp?.is_key_player
          }
        }
      })

      setWaitingList(normalizedWaiting)

  // Fetch available members for guest selection
  await fetchAvailableMembers()
    } catch (error) {
      console.error('Error fetching match details:', error)
    } finally {
      setLoading(false)
    }
  }, [matchId, supabase, fetchAvailableMembers])

  useEffect(() => {
    fetchMatchDetails()
  }, [fetchMatchDetails])

  const joinMatch = async () => {
    setJoining(true)
    try {
      // Get current user's team_player record
      const { data: teamPlayerData, error: teamPlayerError } = await supabase
        .from('team_players')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('group_id', groupId)
        .single()

      if (teamPlayerError) throw teamPlayerError

      if (!match) throw new Error('Match not found')

      // Calculate total spots and current players
      const totalSpots = (match.teams?.length || 0) * match.max_players_per_team
      const currentPlayers = match.match_players?.length || 0

      if (match.teams_finalized) {
        alert('This match is finalized. No more players can join.')
        return
      }

      if (!match.teams_created && currentPlayers >= totalSpots) {
        // Join waiting list
        const { error: waitingError } = await supabase
          .from('match_waiting_list')
          .insert({
            match_id: matchId,
            team_player_id: teamPlayerData.id
          })

        if (waitingError) throw waitingError
        alert('Match is full! You have been added to the waiting list.')
      } else {
        // Join the match player list
        const { error: joinError } = await supabase
          .from('match_players')
          .insert({
            match_id: matchId,
            team_player_id: teamPlayerData.id
          })

        if (joinError) throw joinError
        alert('Successfully joined the match!')
      }

      fetchMatchDetails()
    } catch (error: any) {
      console.error('Error joining match:', error)
      alert('Error joining match: ' + error.message)
    } finally {
      setJoining(false)
    }
  }

  const leaveMatch = async () => {
    if (!confirm('Are you sure you want to leave this match?')) return
    if (!match) return

    // Prevent leaving if teams are created
    if (match.teams_created) {
      alert('Cannot leave match - teams have already been created!')
      return
    }

    try {
      if (match?.teams_finalized) {
        alert('This match is finalized. You cannot leave.')
        return
      }

      // Get current user's team_player record
      const { data: teamPlayerData, error: teamPlayerError } = await supabase
        .from('team_players')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('group_id', groupId)
        .single()

      if (teamPlayerError) throw teamPlayerError

      // Remove from match_players
      const { error: leaveError } = await supabase
        .from('match_players')
        .delete()
        .eq('team_player_id', teamPlayerData.id)
        .eq('match_id', matchId)

      if (leaveError) throw leaveError

      // Also remove from waiting list if they're on it
      await supabase
        .from('match_waiting_list')
        .delete()
        .eq('match_id', matchId)
        .eq('team_player_id', teamPlayerData.id)

      fetchMatchDetails()
      alert('Successfully left the match!')
    } catch (error: any) {
      console.error('Error leaving match:', error)
      alert('Error leaving match: ' + error.message)
    }
  }

  const moveFromWaitingList = async (waitingPlayerId: string, teamId: string) => {
    try {
      const waitingPlayer = waitingList.find(p => p.id === waitingPlayerId)
      if (!waitingPlayer) return

      // Add to team
      const { error: addError } = await supabase
        .from('match_players')
        .insert({
          team_id: teamId,
          team_player_id: waitingPlayer.team_players.users.id
        })

      if (addError) throw addError

      // Remove from waiting list
      const { error: removeError } = await supabase
        .from('match_waiting_list')
        .delete()
        .eq('id', waitingPlayerId)

      if (removeError) throw removeError

      fetchMatchDetails()
    } catch (error: any) {
      console.error('Error moving from waiting list:', error)
      alert('Error moving player: ' + error.message)
    }
  }

  const removePlayer = async (playerId: string, playerName: string) => {
    if (!confirm(`Remove ${playerName} from this match?`)) return
    if (!match) return

    try {
      const { error } = await supabase
        .from('match_players')
        .delete()
        .eq('id', playerId)

      if (error) throw error

      // Check if there's space now and move someone from waiting list
      const totalSpots = match.planned_teams * match.max_players_per_team
      const currentPlayers = (match.match_players?.length || 0) - 1 // Subtract the player we just removed
      
      if (currentPlayers < totalSpots && waitingList.length > 0) {
        // Move first person from waiting list to match players
        const firstWaitingPlayer = waitingList[0]
        
        // Add to match players using the team_player_id from the waiting list record
        const { error: addError } = await supabase
          .from('match_players')
          .insert({
            match_id: matchId,
            team_player_id: firstWaitingPlayer.team_player_id,
            team_id: null,
            guest_name: null
          })

        if (addError) throw addError

        // Remove from waiting list
        const { error: removeError } = await supabase
          .from('match_waiting_list')
          .delete()
          .eq('id', firstWaitingPlayer.id)

        if (removeError) throw removeError

        alert(`${playerName} removed from match. ${firstWaitingPlayer.team_players.users.name} has been moved from waiting list to the match!`)
      } else {
        alert(`${playerName} removed from match successfully!`)
      }

      fetchMatchDetails()
    } catch (error: any) {
      console.error('Error removing player:', error)
      alert('Error removing player: ' + error.message)
    }
  }

  const addGuestFromModal = async (guestId: string) => {
    if (addingGuest === guestId) return // Prevent duplicate clicks
    if (!match) return
    
    setAddingGuest(guestId)
    try {
      // Check if user is already in the match
      const { data: existingPlayer } = await supabase
        .from('match_players')
        .select('id')
        .eq('match_id', matchId)
        .eq('team_player_id', guestId)
        .single()

      if (existingPlayer) {
        alert('This player is already in the match!')
        return
      }

      // Check if user is on waiting list
      const { data: waitingPlayer } = await supabase
        .from('match_waiting_list')
        .select('id')
        .eq('match_id', matchId)
        .eq('team_player_id', guestId)
        .single()

      if (waitingPlayer) {
        alert('This player is already on the waiting list!')
        return
      }

      // Check match capacity
      const totalSpots = match.planned_teams * match.max_players_per_team
      const currentPlayers = match.match_players?.length || 0
      
      if (currentPlayers >= totalSpots) {
        // Match is full, add to waiting list
        const { error } = await supabase
          .from('match_waiting_list')
          .insert({
            match_id: matchId,
            team_player_id: guestId
          })

        if (error) throw error

        const selectedMember = availableMembers.find(m => m.id === guestId)
        fetchMatchDetails()
        alert(`Match is full! ${selectedMember?.name} has been added to the waiting list.`)
      } else {
        // Space available, add to match
        const { error } = await supabase
          .from('match_players')
          .insert({
            match_id: matchId,
            team_player_id: guestId,
            team_id: null,
            guest_name: null
          })

        if (error) throw error

        const selectedMember = availableMembers.find(m => m.id === guestId)
        fetchMatchDetails()
        alert(`${selectedMember?.name} added to match successfully!`)
      }
    } catch (error: any) {
      console.error('Error adding guest:', error)
      alert('Error adding guest: ' + error.message)
    } finally {
      setAddingGuest(null)
    }
  }

  const addGuest = async () => {
    if (!selectedGuestMember) {
      alert('Please select a group member to add as guest')
      return
    }

    try {
      // Add selected group member to match players directly
      const { error: matchError } = await supabase
        .from('match_players')
        .insert({
          match_id: matchId,
          team_player_id: selectedGuestMember
        })

      if (matchError) throw matchError

      const selectedMember = availableMembers.find(m => m.id === selectedGuestMember)
      
      setSelectedGuestMember('')
      setShowAddGuest(false)
      fetchMatchDetails()
      alert(`${selectedMember?.name} added to match successfully!`)
    } catch (error: any) {
      console.error('Error adding guest:', error)
      alert('Error adding guest: ' + error.message)
    }
  }

  const createTeams = async () => {
    if (!confirm('Create teams from current players? This will randomize players into teams.')) return

    setCreatingTeams(true)
    try {
      if (!match) throw new Error('Match not found')

      // Get the total number of players
      const totalPlayers = match.match_players?.length || 0
      
      if (totalPlayers === 0) {
        alert('No players to create teams with!')
        return
      }

      // Calculate optimal number of teams based on planned teams and current players
      const minTeams = 2 // Always have at least 2 teams
      const plannedTeams = match.planned_teams || 2
      const optimalForPlayers = Math.ceil(totalPlayers / match.max_players_per_team)
      
      // Use planned teams if reasonable, otherwise optimize for current players
      const numberOfTeams = totalPlayers <= plannedTeams * match.max_players_per_team ? 
        Math.max(minTeams, Math.min(plannedTeams, Math.ceil(totalPlayers / 3))) :
        Math.max(minTeams, optimalForPlayers)

      console.log('Creating teams:', { totalPlayers, maxPlayersPerTeam: match.max_players_per_team, numberOfTeams })

      // Delete any existing teams for this match first (in case of re-creation)
      await supabase
        .from('teams')
        .delete()
        .eq('match_id', matchId)

      // Create the calculated number of teams
      const teams = []
      for (let i = 1; i <= numberOfTeams; i++) {
        teams.push({
          match_id: matchId,
          name: `Team ${String.fromCharCode(64 + i)}` // Team A, Team B, etc.
        })
      }

      const { data: createdTeams, error: teamsError } = await supabase
        .from('teams')
        .insert(teams)
        .select()

      if (teamsError) throw teamsError

      // Clear any existing team assignments
      await supabase
        .from('match_players')
        .update({ team_id: null })
        .eq('match_id', matchId)

      // Randomize and distribute players evenly across teams
      const shuffledPlayers = [...(match.match_players || [])].sort(() => Math.random() - 0.5)
      
      // Distribute players in round-robin fashion for even distribution
      for (let i = 0; i < shuffledPlayers.length; i++) {
        const teamIndex = i % numberOfTeams
        const teamId = createdTeams[teamIndex].id

        const { error: updateError } = await supabase
          .from('match_players')
          .update({ team_id: teamId })
          .eq('id', shuffledPlayers[i].id)

        if (updateError) {
          console.error('Error assigning player to team:', updateError)
          throw updateError
        }
      }

      // Mark teams as created
      await supabase
        .from('matches')
        .update({ teams_created: true })
        .eq('id', matchId)

      fetchMatchDetails()
      alert(`Teams created successfully! ${numberOfTeams} teams with players distributed evenly.`)
    } catch (error: any) {
      console.error('Error creating teams:', error)
      alert('Error creating teams: ' + error.message)
    } finally {
      setCreatingTeams(false)
    }
  }

  const randomizeTeams = async () => {
    if (!confirm('Randomize teams again? This will shuffle all players into new teams.')) return

    setRandomizingTeams(true)
    try {
      if (!match) throw new Error('Match not found')

      // Get all current players
      const allPlayers = match.match_players || []
      if (allPlayers.length === 0) {
        alert('No players to randomize!')
        return
      }

      // Shuffle players array
      const shuffledPlayers = [...allPlayers].sort(() => Math.random() - 0.5)
      
      // Get existing teams
      const teams = match.teams || []
      if (teams.length === 0) {
        alert('No teams exist to randomize into!')
        return
      }

      // Update each player's team assignment individually
      for (let i = 0; i < shuffledPlayers.length; i++) {
        const player = shuffledPlayers[i]
        const assignedTeam = teams[i % teams.length]
        
        const { error } = await supabase
          .from('match_players')
          .update({ team_id: assignedTeam.id })
          .eq('id', player.id)
          
        if (error) throw error
      }

      fetchMatchDetails()
      alert('Teams randomized successfully!')
    } catch (error: any) {
      console.error('Error randomizing teams:', error)
      alert('Error randomizing teams: ' + error.message)
    } finally {
      setRandomizingTeams(false)
    }
  }

  const deleteMatch = async () => {
    if (!confirm('Delete this match permanently? This action cannot be undone.')) return
    if (!confirm('Are you absolutely sure? All match data will be lost.')) return

    setDeletingMatch(true)
    try {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId)

      if (error) throw error

      alert('Match deleted successfully!')
      onClose() // Close the modal and return to matches list
    } catch (error: any) {
      console.error('Error deleting match:', error)
      alert('Error deleting match: ' + error.message)
    } finally {
      setDeletingMatch(false)
    }
  }

  const finalizeTeams = async () => {
    if (!confirm('Finalize teams? After this, no players can join or leave the match.')) return

    setFinalizingTeams(true)
    try {
      await supabase
        .from('matches')
        .update({ teams_finalized: true })
        .eq('id', matchId)

      fetchMatchDetails()
      alert('Teams finalized! Match is now closed to changes.')
    } catch (error: any) {
      console.error('Error finalizing teams:', error)
      alert('Error finalizing teams: ' + error.message)
    } finally {
      setFinalizingTeams(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6">
          <p>Loading match details...</p>
        </div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6">
          <p>Match not found</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md">
            Close
          </button>
        </div>
      </div>
    )
  }

  const matchDate = new Date(match.date_time)
  const isUpcoming = matchDate > new Date()
  const isToday = matchDate.toDateString() === new Date().toDateString()

  // Check if current user is already in the match
  const currentUserInMatch = match?.match_players?.some(player => 
    player.team_players?.users.id === currentUserId
  ) || false

  // Check if current user is on waiting list
  const currentUserOnWaitingList = waitingList.some(player => 
    player.team_players.users.id === currentUserId
  )

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Football Match</h2>
                <div className="flex items-center gap-2 mt-1">
                  {isToday && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      Today
                    </span>
                  )}
                  {isUpcoming && !isToday && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      Upcoming
                    </span>
                  )}
                  {!isUpcoming && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                      Past
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Match Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Date & Time</span>
                  <p className="font-medium">
                    {mounted ? matchDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Loading...'}
                  </p>
                  <p className="text-gray-600">
                    {mounted ? matchDate.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    }) : 'Loading...'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Location</span>
                  <p className="font-medium">{match.location || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Format</span>
                  {match.teams_created ? (
                    <>
                      <p className="font-medium">{match.teams.length} teams, {match.max_players_per_team} players each</p>
                      <p className="text-gray-600">{match.teams.length * match.max_players_per_team} total spots</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">{match.planned_teams} teams planned, {match.max_players_per_team} players each</p>
                      <p className="text-gray-600">{match.planned_teams * match.max_players_per_team} total spots available</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Join/Leave Actions */}
            {isUpcoming && !match.teams_finalized && (
              <div className="mb-6">
                {!currentUserInMatch && !currentUserOnWaitingList ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-3">Join this match</h4>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={joinMatch}
                        disabled={joining || match.teams_created}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                      >
                        {joining ? 'Joining...' : match.teams_created ? 'Teams Created' : 'Join Match'}
                      </button>
                      <p className="text-sm text-blue-700">
                        {match.teams_created ? 
                          'Teams have been created. New players cannot join.' :
                          'You\'ll be added to the player list and assigned to a team when teams are created'
                        }
                      </p>
                    </div>
                  </div>
                ) : currentUserInMatch ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-green-900">You&apos;re in this match!</h4>
                        <p className="text-green-700 text-sm">
                          {match.teams_created ? 'Check your team assignment below.' : 'You\'ll be assigned to a team when teams are created.'}
                        </p>
                        {match.teams_created && (
                          <p className="text-orange-600 text-xs mt-1">
                            ⚠️ Teams have been created. You can no longer leave this match.
                          </p>
                        )}
                      </div>
                      {!match.teams_created && (
                        <button
                          onClick={leaveMatch}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                          Leave Match
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900">You&apos;re on the waiting list</h4>
                    <p className="text-yellow-700 text-sm">You&apos;ll be notified if a spot opens up.</p>
                    {match.teams_created && (
                      <p className="text-orange-600 text-xs mt-1">
                        ⚠️ Teams have been created. Waiting list is now closed.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {match.teams_finalized && (
              <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">Match Finalized</h4>
                <p className="text-gray-700 text-sm">Teams are set and the match is closed to changes.</p>
              </div>
            )}

            {/* Admin Controls */}
            {isAdmin && isUpcoming && (
              <div className="mb-6 bg-white border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Admin Controls</h4>
                <div className="flex flex-wrap gap-2">
                  {!match.teams_created && !match.teams_finalized && !creatingTeams && (
                    <button
                      onClick={() => setShowGuestModal(true)}
                      className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                    >
                      Add Group Member
                    </button>
                  )}
                  
                  {!match.teams_created && !match.teams_finalized && (match.match_players?.length || 0) > 0 && (
                    <button
                      onClick={createTeams}
                      disabled={creatingTeams}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm"
                    >
                      {creatingTeams ? 'Creating...' : 'Create Teams'}
                    </button>
                  )}
                  
                  {match.teams_created && !match.teams_finalized && (
                    <>
                      <button
                        onClick={randomizeTeams}
                        disabled={randomizingTeams}
                        className="px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 transition-colors text-sm"
                      >
                        {randomizingTeams ? 'Randomizing...' : 'Randomize Teams'}
                      </button>
                      <button
                        onClick={finalizeTeams}
                        disabled={finalizingTeams}
                        className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 transition-colors text-sm"
                      >
                        {finalizingTeams ? 'Finalizing...' : 'Finalize Teams'}
                      </button>
                    </>
                  )}
                  
                  {/* Delete Match - Always available to admins */}
                  <button
                    onClick={deleteMatch}
                    disabled={deletingMatch}
                    className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 transition-colors text-sm ml-auto"
                  >
                    {deletingMatch ? 'Deleting...' : 'Delete Match'}
                  </button>
                </div>

                {/* Guest Management Modal */}
                {showGuestModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
                      <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="text-lg font-semibold">Add Group Members to Match</h3>
                        <button
                          onClick={() => setShowGuestModal(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="p-4">
                        {availableMembers.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-gray-500">All group members are already participating in this match.</p>
                          </div>
                        ) : (
                          <>
                            <div className="mb-4">
                              <input
                                type="text"
                                placeholder="Search members..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                              {availableMembers.map(member => (
                                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                      <span className="text-sm font-medium text-blue-800">
                                        {member.name.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">{member.name}</p>
                                      <p className="text-sm text-gray-500">{member.email}</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => addGuestFromModal(member.id)}
                                    disabled={addingGuest === member.id}
                                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm"
                                  >
                                    {addingGuest === member.id ? 'Adding...' : 'Add'}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Player List or Teams */}
            <div className="space-y-6">
              {!match.teams_created ? (
                /* Show Player List */
                <div>
                  <h3 className="text-lg font-semibold mb-4">Registered Players</h3>
                  {(match.match_players?.length || 0) === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <p className="text-gray-500">No players registered yet.</p>
                    </div>
                  ) : isAdmin || match.created_by === currentUserId ? (
                    <div className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-600">
                          {match.match_players?.length || 0}/{match.planned_teams * match.max_players_per_team} players registered
                        </span>
                        <span className="text-xs text-gray-500">
                          Teams will be created from this list
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {match.match_players?.map(player => (
                          <div key={player.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-800">
                                {player.guest_name ? 
                                  player.guest_name.charAt(0).toUpperCase() :
                                  player.team_players?.users.name.charAt(0).toUpperCase()
                                }
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {player.guest_name || player.team_players?.users.name}
                              </p>
                              {player.team_players && (
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>{player.team_players.preferred_position}</span>
                                  <span>•</span>
                                  <span>{player.team_players.rating}/10</span>
                                  {player.team_players.is_key_player && (
                                    <>
                                      <span>•</span>
                                      <span className="text-yellow-600">⭐</span>
                                    </>
                                  )}
                                </div>
                              )}
                              {player.guest_name && (
                                <span className="text-xs text-orange-600">Guest Player</span>
                              )}
                            </div>
                            {(isAdmin || match.created_by === currentUserId) && (
                              <button
                                onClick={() => removePlayer(player.id, player.guest_name || player.team_players?.users.name || 'Player')}
                                className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-xs"
                                title="Remove player"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-600">
                          {match.match_players?.length || 0} players registered
                        </span>
                        <span className="text-xs text-gray-500">
                          Teams will be created from this list
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {match.match_players?.map(player => (
                          <div key={player.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-800">
                                {player.guest_name ? 
                                  player.guest_name.charAt(0).toUpperCase() :
                                  player.team_players?.users.name.charAt(0).toUpperCase()
                                }
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {player.guest_name || player.team_players?.users.name}
                              </p>
                              {player.guest_name && (
                                <span className="text-xs text-orange-600">Guest Player</span>
                              )}
                            </div>
                            {(isAdmin || match.created_by === currentUserId) && (
                              <button
                                onClick={() => removePlayer(player.id, player.guest_name || player.team_players?.users.name || 'Player')}
                                className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-xs"
                                title="Remove player"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Show Teams */
                <div>
                  <h3 className="text-lg font-semibold mb-4">Teams</h3>
                  {isAdmin || match.created_by === currentUserId ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {match.teams.map(team => (
                        <div key={team.id} className="bg-white border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">{team.name}</h4>
                            <span className="text-sm text-gray-500">
                              {team.match_players.length} players
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            {team.match_players.map(player => (
                              <div key={player.id} className="flex items-center gap-2 text-sm">
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-blue-800">
                                    {player.guest_name ? 
                                      player.guest_name.charAt(0).toUpperCase() :
                                      player.team_players?.users.name.charAt(0).toUpperCase()
                                    }
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {player.guest_name || player.team_players?.users.name}
                                  </p>
                                  {player.team_players && (
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <span>{player.team_players.preferred_position}</span>
                                      <span>•</span>
                                      <span>Rating: {player.team_players.rating}/10</span>
                                      {player.team_players.is_key_player && (
                                        <>
                                          <span>•</span>
                                          <span className="text-yellow-600">⭐ Key</span>
                                        </>
                                      )}
                                    </div>
                                  )}
                                  {player.guest_name && (
                                    <span className="text-xs text-orange-600">Guest</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : match.teams_finalized ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {match.teams.map(team => (
                        <div key={team.id} className="bg-white border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">{team.name}</h4>
                            <span className="text-sm text-gray-500">
                              {team.match_players.length} players
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            {team.match_players.map(player => (
                              <div key={player.id} className="flex items-center gap-2 text-sm">
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-blue-800">
                                    {player.guest_name ? 
                                      player.guest_name.charAt(0).toUpperCase() :
                                      player.team_players?.users.name.charAt(0).toUpperCase()
                                    }
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {player.guest_name || player.team_players?.users.name}
                                  </p>
                                  {player.guest_name && (
                                    <span className="text-xs text-orange-600">Guest</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                      <div className="mb-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <h4 className="font-medium text-blue-900">Teams Created</h4>
                        <p className="text-blue-700 text-sm mt-1">
                          Team assignments are being reviewed by the organizers.
                        </p>
                        <p className="text-blue-600 text-sm mt-2">
                          Teams will be revealed once finalized.
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>{match.teams?.length || 0} teams</strong> have been created from <strong>{match.match_players?.length || 0} players</strong>
                        </p>
                        <div className="text-xs text-gray-500">
                          You&apos;ll be notified when team assignments are finalized.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Waiting List */}
            {waitingList.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Waiting List</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  {isAdmin || match.created_by === currentUserId ? (
                    <div className="space-y-2">
                      {waitingList.map((player, index) => (
                        <div key={player.id} className="flex items-center gap-3 text-sm">
                          <span className="text-yellow-700 font-medium">#{index + 1}</span>
                          <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-yellow-800">
                              {player.team_players.users.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{player.team_players.users.name}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{player.team_players.preferred_position}</span>
                              <span>•</span>
                              <span>Rating: {player.team_players.rating}/10</span>
                              {player.team_players.is_key_player && (
                                <>
                                  <span>•</span>
                                  <span className="text-yellow-600">⭐ Key</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {waitingList.map((player, index) => (
                        <div key={player.id} className="flex items-center gap-3 text-sm">
                          <span className="text-yellow-700 font-medium">#{index + 1}</span>
                          <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-yellow-800">
                              {player.team_players.users.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{player.team_players.users.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}