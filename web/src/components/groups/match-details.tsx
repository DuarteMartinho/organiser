'use client'

import { useState, useEffect, useCallback } from 'react'
import SearchableSelect from '@/components/ui/searchable-select'
import { fetchMatchDetailsAction } from '@/actions/match-details/fetch-match-details'
import { fetchWaitingListAction } from '@/actions/match-details/fetch-waiting-list'
import { fetchAvailableMembersAction } from '@/actions/match-details/fetch-available-members'
import { createTeamsAction } from '@/actions/match-details/create-teams'
import { assignPlayerToTeamAction } from '@/actions/match-details/assign-player-to-team'
import { removePlayerFromMatchAction } from '@/actions/match-details/remove-player-from-match'
import { finalizeTeamsAction } from '@/actions/match-details/finalize-teams'
import { deleteMatchAction } from '@/actions/match-details/delete-match'
import { randomizeTeamsAction } from '@/actions/match-details/randomize-teams'
import { addMatchPlayerAction } from '@/actions/match-players/add-match-player'
import { getTeamPlayerAction } from '@/actions/team-players/get-team-player'
import { addToWaitingListAction } from '@/actions/match-waiting-list/add-to-waiting-list'
import { deleteFromWaitingListAction } from '@/actions/match-waiting-list/delete-waiting-list'
import { deleteMatchPlayerAction } from '@/actions/match-players/delete-match-player'
import { useToast } from '@/hooks/useToast'
import { useConfirm } from '@/hooks/useConfirm'

interface MatchDetailsProps {
  matchId: string
  onClose: () => void
  isAdmin: boolean
  currentUserId: string
  groupId: string
}

interface Team {
  id: string
  name: string | null
  matchPlayers: Array<{
    id: string
    teamPlayerId: string | null
    guestName: string | null
    joinedAt: Date | null
    teamPlayers?: {
      users: {
        id: string | null
        name: string | null
        email: string | null
      }
      rating: number | null
      preferredPosition: string | null
      isKeyPlayer: boolean | null
    } | null
  }>
}

interface MatchPlayer {
  id: string
  teamPlayerId: string | null
  guestName: string | null
  joinedAt: Date | null
  teamPlayers?: {
    users: {
      id: string | null
      name: string | null
      email: string | null
    }
    rating: number | null
    preferredPosition: string | null
    isKeyPlayer: boolean | null
  } | null
}

interface Match {
  id: string
  dateTime: Date | string | null
  location: string | null
  maxPlayersPerTeam: number | null
  plannedTeams: number | null
  createdAt: Date | null
  createdBy: string | null
  teamsCreated: boolean | null
  teamsFinalized: boolean | null
  teams: Team[]
  matchPlayers: MatchPlayer[]
}

interface WaitingListPlayer {
  id: string
  teamPlayerId: string | null
  joinedAt: Date | null
  teamPlayers: {
    users: {
      id: string | null
      name: string | null
      email: string | null
    }
    rating: number | null
    preferredPosition: string | null
    isKeyPlayer: boolean | null
  }
}

export default function MatchDetails({ matchId, onClose, isAdmin, currentUserId, groupId }: MatchDetailsProps) {
  const toast = useToast()
  const confirm = useConfirm()
  const [match, setMatch] = useState<Match | null>(null)
  const [waitingList, setWaitingList] = useState<WaitingListPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [showAddGuest, setShowAddGuest] = useState(false)
  const [showGuestModal, setShowGuestModal] = useState(false)
  const [selectedGuestMember, setSelectedGuestMember] = useState<string>('')
  const [availableMembers, setAvailableMembers] = useState<Array<{id: string, name: string, email: string, teamPlayerId?: string}>>([])  
  const [creatingTeams, setCreatingTeams] = useState(false)
  const [finalizingTeams, setFinalizingTeams] = useState(false)
  const [randomizingTeams, setRandomizingTeams] = useState(false)
  const [deletingMatch, setDeletingMatch] = useState(false)
  const [addingGuest, setAddingGuest] = useState<string | null>(null) // Track which guest is being added

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchAvailableMembers = useCallback(async () => {
    try {
      const available = await fetchAvailableMembersAction(groupId, matchId)
      setAvailableMembers(available)
    } catch (error) {
      console.error('Error fetching available members:', error)
    }
  }, [groupId, matchId])

  const filterAvailableMembers = useCallback(() => {
    if (!match) return availableMembers

    // Get all team player IDs already in the match
    const matchPlayerIds = new Set(
      match.matchPlayers?.map(player => player.teamPlayerId).filter(Boolean) || []
    )

    // Get all team player IDs on the waiting list
    const waitingListPlayerIds = new Set(
      waitingList.map(player => player.teamPlayerId).filter(Boolean)
    )

    // Filter out members who are already in match or waiting list
    return availableMembers.filter(member => {
      const isInMatch = member.teamPlayerId && matchPlayerIds.has(member.teamPlayerId)
      const isInWaitingList = member.teamPlayerId && waitingListPlayerIds.has(member.teamPlayerId)
      return !isInMatch && !isInWaitingList
    })
  }, [availableMembers, match, waitingList])

  const fetchMatchDetails = useCallback(async () => {
    try {
      // Fetch match with teams and players
      const matchData = await fetchMatchDetailsAction(matchId)
      setMatch(matchData)

      // Fetch waiting list
      const waitingData = await fetchWaitingListAction(matchId)
      setWaitingList(waitingData)

      // Fetch available members for guest selection
      await fetchAvailableMembers()
    } catch (error) {
      console.error('Error fetching match details:', error)
    } finally {
      setLoading(false)
    }
  }, [matchId, fetchAvailableMembers])

  useEffect(() => {
    fetchMatchDetails()
  }, [fetchMatchDetails])

  const moveWaitingListToMatch = async () => {
    try {
      // Fetch fresh data to get accurate counts
      const matchData = await fetchMatchDetailsAction(matchId)
      const waitingData = await fetchWaitingListAction(matchId)

      if (!matchData || matchData.teamsCreated) return

      // Calculate available spots with fresh data
      const totalSpots = (matchData.plannedTeams || 2) * (matchData.maxPlayersPerTeam || 11)
      const currentPlayers = matchData.matchPlayers?.length || 0
      const availableSpots = totalSpots - currentPlayers

      if (availableSpots <= 0 || waitingData.length === 0) return

      // Sort waiting list by joinedAt (FIFO - earliest first)
      const sortedWaitingList = [...waitingData].sort((a, b) => {
        const dateA = a.joinedAt ? new Date(a.joinedAt).getTime() : 0
        const dateB = b.joinedAt ? new Date(b.joinedAt).getTime() : 0
        return dateA - dateB
      })

      // Move first player from sorted waiting list to match
      const firstWaitingPlayer = sortedWaitingList[0]
      
      // Add to match
      await addMatchPlayerAction({
        matchId,
        teamPlayerId: firstWaitingPlayer.teamPlayerId || '',
        teamId: null,
        guestName: null,
      })

      // Remove from waiting list
      await deleteFromWaitingListAction(matchId, firstWaitingPlayer.teamPlayerId || '')

      toast.success(`${firstWaitingPlayer.teamPlayers.users.name} moved from waiting list to match!`)
      
      // Refresh component state
      await fetchMatchDetails()
      
      // Recursively check if more players can be moved
      if (availableSpots > 1) {
        await moveWaitingListToMatch()
      }
    } catch (error: any) {
      console.error('Error moving player from waiting list:', error)
    }
  }

  const joinMatch = async () => {
    setJoining(true)
    try {
      const teamPlayer = await getTeamPlayerAction(currentUserId, groupId)
      if (!teamPlayer) throw new Error('You must be a member of this group')

      if (!match) throw new Error('Match not found')

      // Calculate total spots and current players
      const totalSpots = (match.plannedTeams || 2) * (match.maxPlayersPerTeam || 11)
      const currentPlayers = match.matchPlayers?.length || 0

      if (match.teamsFinalized) {
        toast.warning('This match is finalized. No more players can join.')
        return
      }

      if (!match.teamsCreated && currentPlayers >= totalSpots) {
        // Join waiting list
        await addToWaitingListAction({
          matchId,
          teamPlayerId: teamPlayer.id
        })
        toast.info('Match is full! You have been added to the waiting list.')
      } else {
        // Join the match player list
        await addMatchPlayerAction({
          matchId,
          teamPlayerId: teamPlayer.id,
          teamId: null,
          guestName: null
        })
        toast.success('Successfully joined the match!')
      }

      fetchMatchDetails()
    } catch (error: any) {
      console.error('Error joining match:', error)
      toast.error('Error joining match: ' + error.message)
    } finally {
      setJoining(false)
    }
  }

  const leaveMatch = async () => {
    if (!match) return

    // Determine if user is on waiting list or in match
    const onWaitingList = waitingList.some(player => 
      player.teamPlayers.users.id === currentUserId
    )

    const confirmed = await confirm({
      title: onWaitingList ? 'Leave Waiting List' : 'Leave Match',
      message: onWaitingList 
        ? 'Are you sure you want to leave the waiting list?' 
        : 'Are you sure you want to leave this match?',
      confirmText: 'Leave',
      variant: 'warning',
    })
    
    if (!confirmed) return

    // Prevent leaving if teams are created (only for match players, not waiting list)
    if (!onWaitingList && match.teamsCreated) {
      toast.warning('Cannot leave match - teams have already been created!')
      return
    }

    try {
      if (!onWaitingList && match?.teamsFinalized) {
        toast.warning('This match is finalized. You cannot leave.')
        return
      }

      const teamPlayer = await getTeamPlayerAction(currentUserId, groupId)
      if (!teamPlayer) throw new Error('Team player not found')

      // Remove from match_players
      await deleteMatchPlayerAction(teamPlayer.id, matchId)

      // Also remove from waiting list if they're on it
      await deleteFromWaitingListAction(matchId, teamPlayer.id)

      // Refresh match data first
      await fetchMatchDetails()
      
      toast.success(onWaitingList ? 'Successfully left the waiting list!' : 'Successfully left the match!')
      
      // If player was in match (not waiting list), try to move someone from waiting list
      if (!onWaitingList) {
        await moveWaitingListToMatch()
      }
    } catch (error: any) {
      console.error('Error leaving match:', error)
      toast.error('Error: ' + error.message)
    }
  }

  const removePlayer = async (playerId: string, playerName: string) => {
    const confirmed = await confirm({
      title: 'Remove Player',
      message: `Remove ${playerName} from this match?`,
      confirmText: 'Remove',
      variant: 'warning',
    })
    
    if (!confirmed) return
    if (!match) return

    try {
      await removePlayerFromMatchAction(playerId)
      
      // Refresh match data first
      await fetchMatchDetails()
      
      toast.success('Player removed from match successfully!')
      
      // Try to move someone from waiting list to fill the spot
      await moveWaitingListToMatch()
    } catch (error: any) {
      console.error('Error removing player:', error)
      toast.error('Error removing player: ' + error.message)
    }
  }

  const removeFromWaitingList = async (teamPlayerId: string, playerName: string) => {
    const confirmed = await confirm({
      title: 'Remove from Waiting List',
      message: `Remove ${playerName} from the waiting list?`,
      confirmText: 'Remove',
      variant: 'warning',
    })
    
    if (!confirmed) return

    try {
      await deleteFromWaitingListAction(matchId, teamPlayerId)
      
      fetchMatchDetails()
      toast.success('Player removed from waiting list successfully!')
    } catch (error: any) {
      console.error('Error removing player from waiting list:', error)
      toast.error('Error removing player: ' + error.message)
    }
  }

  const addMemberToMatch = async (memberId: string) => {
    // Prevent spam clicking
    if (addingGuest !== null) return
    
    setAddingGuest(memberId) // Set loading state
    try {
      const member = availableMembers.find(m => m.id === memberId)
      if (!member || !match) return

      // Calculate total spots and current players
      const totalSpots = (match.plannedTeams || 2) * (match.maxPlayersPerTeam || 11)
      const currentPlayers = match.matchPlayers?.length || 0

      if (match.teamsFinalized) {
        toast.warning('This match is finalized. No more players can be added.')
        return
      }

      if (!match.teamsCreated && currentPlayers >= totalSpots) {
        // Add to waiting list if match is full
        await addToWaitingListAction({
          matchId,
          teamPlayerId: member.teamPlayerId || ''
        })
        toast.info(`Match is full! ${member.name} has been added to the waiting list.`)
      } else {
        // Add to the match player list
        await addMatchPlayerAction({
          matchId,
          teamPlayerId: member.teamPlayerId || '',
          teamId: null,
          guestName: null,
        })
        toast.success(`${member.name} added to match successfully!`)
      }

      fetchMatchDetails()
    } catch (error: any) {
      console.error('Error adding member:', error)
      toast.error('Error adding member: ' + error.message)
    } finally {
      setAddingGuest(null) // Clear loading state
    }
  }

  const assignPlayer = async (playerId: string, teamId: string) => {
    try {
      await assignPlayerToTeamAction(playerId, teamId)
      fetchMatchDetails()
    } catch (error: any) {
      console.error('Error assigning player:', error)
      toast.error('Error assigning player: ' + error.message)
    }
  }

  const createTeams = async () => {
    const confirmed = await confirm({
      title: 'Create Teams',
      message: 'Create teams from current players? This will randomize players into teams.',
      confirmText: 'Create Teams',
      variant: 'info',
    })
    
    if (!confirmed) return
    if (!match || !match.plannedTeams) return

    setCreatingTeams(true)
    try {
      await createTeamsAction(matchId, match.plannedTeams)
      
      fetchMatchDetails()
      toast.success(`Teams created successfully!`)
    } catch (error: any) {
      console.error('Error creating teams:', error)
      toast.error('Error creating teams: ' + error.message)
    } finally {
      setCreatingTeams(false)
    }
  }

  const randomizeTeams = async () => {
    const confirmed = await confirm({
      title: 'Randomize Teams',
      message: 'Randomize teams again? This will shuffle all players into new teams.',
      confirmText: 'Randomize',
      variant: 'warning',
    })
    
    if (!confirmed) return

    setRandomizingTeams(true)
    try {
      await randomizeTeamsAction(matchId)
      fetchMatchDetails()
      toast.success('Teams randomized successfully!')
    } catch (error: any) {
      console.error('Error randomizing teams:', error)
      toast.error('Error randomizing teams: ' + error.message)
    } finally {
      setRandomizingTeams(false)
    }
  }

  const deleteMatch = async () => {
    const confirmed = await confirm({
      title: 'Delete Match',
      message: 'Delete this match permanently? This action cannot be undone. All match data will be lost.',
      confirmText: 'Delete Permanently',
      variant: 'danger',
    })
    
    if (!confirmed) return

    setDeletingMatch(true)
    try {
      await deleteMatchAction(matchId)
      toast.success('Match deleted successfully!')
      onClose()
    } catch (error: any) {
      console.error('Error deleting match:', error)
      toast.error('Error deleting match: ' + error.message)
    } finally {
      setDeletingMatch(false)
    }
  }

  const finalizeTeams = async () => {
    const confirmed = await confirm({
      title: 'Finalize Teams',
      message: 'Finalize teams? After this, no players can join or leave the match.',
      confirmText: 'Finalize',
      variant: 'warning',
    })
    
    if (!confirmed) return

    setFinalizingTeams(true)
    try {
      await finalizeTeamsAction(matchId)
      fetchMatchDetails()
      toast.success('Teams finalized! Match is now closed to changes.')
    } catch (error: any) {
      console.error('Error finalizing teams:', error)
      toast.error('Error finalizing teams: ' + error.message)
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

  const matchDate = new Date(match.dateTime || '')
  const isUpcoming = matchDate > new Date()
  const isToday = matchDate.toDateString() === new Date().toDateString()

  // Check if current user is already in the match
  const currentUserInMatch = match?.matchPlayers?.some((player: MatchPlayer) => 
    player.teamPlayers?.users.id === currentUserId
  ) || false

  // Check if current user is on waiting list
  const currentUserOnWaitingList = waitingList.some(player => 
    player.teamPlayers.users.id === currentUserId
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
                  {match.teamsCreated ? (
                    <>
                      <p className="font-medium">{match.teams.length} teams, {match.maxPlayersPerTeam ?? 0} players each</p>
                      <p className="text-gray-600">{match.teams.length * (match.maxPlayersPerTeam ?? 0)} total spots</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">{match.plannedTeams ?? 0} teams planned, {match.maxPlayersPerTeam ?? 0} players each</p>
                      <p className="text-gray-600">{(match.plannedTeams ?? 0) * (match.maxPlayersPerTeam ?? 0)} total spots available</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Join/Leave Actions */}
            {isUpcoming && !match.teamsFinalized && (
              <div className="mb-6">
                {!currentUserInMatch && !currentUserOnWaitingList ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-3">Join this match</h4>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={joinMatch}
                        disabled={joining || (match.teamsCreated ?? false)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                      >
                        {joining ? 'Joining...' : match.teamsCreated ? 'Teams Created' : 'Join Match'}
                      </button>
                      <p className="text-sm text-blue-700">
                        {match.teamsCreated ? 
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
                          {match.teamsCreated ? 'Check your team assignment below.' : 'You\'ll be assigned to a team when teams are created.'}
                        </p>
                        {match.teamsCreated && (
                          <p className="text-orange-600 text-xs mt-1">
                            ⚠️ Teams have been created. You can no longer leave this match.
                          </p>
                        )}
                      </div>
                      {!match.teamsCreated && (
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
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-yellow-900">You&apos;re on the waiting list</h4>
                        <p className="text-yellow-700 text-sm">You&apos;ll be notified if a spot opens up.</p>
                        {match.teamsCreated && (
                          <p className="text-orange-600 text-xs mt-1">
                            ⚠️ Teams have been created. Waiting list is now closed.
                          </p>
                        )}
                      </div>
                      <button
                        onClick={leaveMatch}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        Leave Waiting List
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {match.teamsFinalized && (
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
                  {!match.teamsCreated && !match.teamsFinalized && !creatingTeams && (
                    <button
                      onClick={() => setShowGuestModal(true)}
                      disabled={addingGuest !== null}
                      className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      Add Group Member
                    </button>
                  )}
                  
                  {!match.teamsCreated && !match.teamsFinalized && (match.matchPlayers?.length || 0) > 0 && (
                    <button
                      onClick={createTeams}
                      disabled={creatingTeams}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm"
                    >
                      {creatingTeams ? 'Creating...' : 'Create Teams'}
                    </button>
                  )}
                  
                  {match.teamsCreated && !match.teamsFinalized && (
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
                  <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={(e) => {
                      // Prevent closing if adding a guest or if clicking on the modal itself
                      if (addingGuest === null && e.target === e.currentTarget) {
                        setShowGuestModal(false)
                      }
                    }}
                  >
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
                      <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="text-lg font-semibold">Add Group Members to Match</h3>
                        <button
                          onClick={() => setShowGuestModal(false)}
                          disabled={addingGuest !== null}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="p-4">
                        {filterAvailableMembers().length === 0 ? (
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
                              {filterAvailableMembers()
                                .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
                                .map(member => (
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
                                    onClick={() => addMemberToMatch(member.id)}
                                    disabled={addingGuest !== null}
                                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed hover:disabled:bg-gray-400 transition-colors text-sm"
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
              {!match.teamsCreated ? (
                /* Show Player List */
                <div>
                  <h3 className="text-lg font-semibold mb-4">Registered Players</h3>
                  {(match.matchPlayers?.length || 0) === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <p className="text-gray-500">No players registered yet.</p>
                    </div>
                  ) : isAdmin || match.createdBy === currentUserId ? (
                    <div className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-600">
                          {match.matchPlayers?.length || 0}/{(match.plannedTeams ?? 0) * (match.maxPlayersPerTeam ?? 0)} players registered
                        </span>
                        <span className="text-xs text-gray-500">
                          Teams will be created from this list
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[...match.matchPlayers]
                          .sort((a, b) => {
                            const nameA = (a.guestName || a.teamPlayers?.users.name || '').toLowerCase()
                            const nameB = (b.guestName || b.teamPlayers?.users.name || '').toLowerCase()
                            return nameA.localeCompare(nameB)
                          })
                          .map(player => (
                          <div key={player.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-800">
                                {player.guestName ? 
                                  player.guestName.charAt(0).toUpperCase() :
                                  (player.teamPlayers?.users.name?.charAt(0).toUpperCase() || 'P')
                                }
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {player.guestName || player.teamPlayers?.users.name}
                              </p>
                              {player.teamPlayers && (
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>{player.teamPlayers.preferredPosition}</span>
                                  <span>•</span>
                                  <span>{player.teamPlayers.rating}/10</span>
                                  {player.teamPlayers.isKeyPlayer && (
                                    <>
                                      <span>•</span>
                                      <span className="text-yellow-600">⭐</span>
                                    </>
                                  )}
                                </div>
                              )}
                              {player.guestName && (
                                <span className="text-xs text-orange-600">Guest Player</span>
                              )}
                            </div>
                            {(isAdmin || match.createdBy === currentUserId) && (
                              <button
                                onClick={() => removePlayer(player.id, player.guestName || player.teamPlayers?.users.name || 'Player')}
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
                          {match.matchPlayers?.length || 0} players registered
                        </span>
                        <span className="text-xs text-gray-500">
                          Teams will be created from this list
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[...match.matchPlayers]
                          .sort((a, b) => {
                            const nameA = (a.guestName || a.teamPlayers?.users.name || '').toLowerCase()
                            const nameB = (b.guestName || b.teamPlayers?.users.name || '').toLowerCase()
                            return nameA.localeCompare(nameB)
                          })
                          .map(player => (
                          <div key={player.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-800">
                                {player.guestName ? 
                                  player.guestName.charAt(0).toUpperCase() :
                                  (player.teamPlayers?.users.name?.charAt(0).toUpperCase() || 'P')
                                }
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {player.guestName || player.teamPlayers?.users.name}
                              </p>
                              {player.guestName && (
                                <span className="text-xs text-orange-600">Guest Player</span>
                              )}
                            </div>
                            {(isAdmin || match.createdBy === currentUserId) && (
                              <button
                                onClick={() => removePlayer(player.id, player.guestName || player.teamPlayers?.users.name || 'Player')}
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
                  {isAdmin || match.createdBy === currentUserId ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {match.teams.map(team => (
                        <div key={team.id} className="bg-white border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">{team.name}</h4>
                            <span className="text-sm text-gray-500">
                              {team.matchPlayers.length} players
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            {team.matchPlayers.map(player => (
                              <div key={player.id} className="flex items-center gap-2 text-sm">
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-blue-800">
                                    {player.guestName ? 
                                      player.guestName.charAt(0).toUpperCase() :
                                      (player.teamPlayers?.users.name?.charAt(0).toUpperCase() || 'P')
                                    }
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {player.guestName || player.teamPlayers?.users.name}
                                  </p>
                                  {player.teamPlayers && (
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <span>{player.teamPlayers.preferredPosition}</span>
                                      <span>•</span>
                                      <span>Rating: {player.teamPlayers.rating}/10</span>
                                      {player.teamPlayers.isKeyPlayer && (
                                        <>
                                          <span>•</span>
                                          <span className="text-yellow-600">⭐ Key</span>
                                        </>
                                      )}
                                    </div>
                                  )}
                                  {player.guestName && (
                                    <span className="text-xs text-orange-600">Guest</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : match.teamsFinalized ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {match.teams.map(team => (
                        <div key={team.id} className="bg-white border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">{team.name}</h4>
                            <span className="text-sm text-gray-500">
                              {team.matchPlayers.length} players
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            {team.matchPlayers.map(player => (
                              <div key={player.id} className="flex items-center gap-2 text-sm">
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-blue-800">
                                    {player.guestName ? 
                                      player.guestName.charAt(0).toUpperCase() :
                                      (player.teamPlayers?.users.name?.charAt(0).toUpperCase() || 'P')
                                    }
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {player.guestName || player.teamPlayers?.users.name}
                                  </p>
                                  {player.guestName && (
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
                          <strong>{match.teams?.length || 0} teams</strong> have been created from <strong>{match.matchPlayers?.length || 0} players</strong>
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
                  {isAdmin || match.createdBy === currentUserId ? (
                    <div className="space-y-2">
                      {[...waitingList]
                        .sort((a, b) => {
                          const dateA = a.joinedAt ? new Date(a.joinedAt).getTime() : 0
                          const dateB = b.joinedAt ? new Date(b.joinedAt).getTime() : 0
                          return dateA - dateB
                        })
                        .map((player, index) => (
                        <div key={player.id} className="flex items-center gap-3 text-sm">
                          <span className="text-yellow-700 font-medium">#{index + 1}</span>
                          <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-yellow-800">
                              {player.teamPlayers.users.name?.charAt(0).toUpperCase() || 'P'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{player.teamPlayers.users.name}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{player.teamPlayers.preferredPosition}</span>
                              <span>•</span>
                              <span>Rating: {player.teamPlayers.rating}/10</span>
                              {player.teamPlayers.isKeyPlayer && (
                                <>
                                  <span>•</span>
                                  <span className="text-yellow-600">⭐ Key</span>
                                </>
                              )}
                            </div>
                          </div>
                          {!match.teamsFinalized && (
                            <button
                              onClick={() => removeFromWaitingList(player.teamPlayerId || '', player.teamPlayers.users.name || 'Player')}
                              className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-xs"
                              title="Remove from waiting list"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {[...waitingList]
                        .sort((a, b) => {
                          const dateA = a.joinedAt ? new Date(a.joinedAt).getTime() : 0
                          const dateB = b.joinedAt ? new Date(b.joinedAt).getTime() : 0
                          return dateA - dateB
                        })
                        .map((player, index) => (
                        <div key={player.id} className="flex items-center gap-3 text-sm">
                          <span className="text-yellow-700 font-medium">#{index + 1}</span>
                          <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-yellow-800">
                              {player.teamPlayers.users.name?.charAt(0).toUpperCase() || 'P'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{player.teamPlayers.users.name}</p>
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