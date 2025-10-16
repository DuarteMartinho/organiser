'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { fetchUserGroupsAction } from '@/actions/groups/fetch-user-groups';
import { fetchUserGroupsWithDetailsAction } from '@/actions/groups/fetch-user-groups-with-details';
import { fetchMatchesAction } from '@/actions/matches/fetch-matches';
import { getTeamPlayerAction } from '@/actions/team-players/get-team-player';
import { deleteMatchPlayerAction } from '@/actions/match-players/delete-match-player';
import { deleteFromWaitingListAction } from '@/actions/match-waiting-list/delete-waiting-list';
import { checkUserInMatchAction } from '@/actions/match-players/check-user-in-match';
import { addMatchPlayerAction } from '@/actions/match-players/add-match-player';
import { addToWaitingListAction } from '@/actions/match-waiting-list/add-to-waiting-list';
import { useToast } from '@/hooks/useToast';

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
  const toast = useToast()
  const [upcomingMatches, setUpcomingMatches] = useState<DashboardMatch[]>([])
  const [pastMatches, setPastMatches] = useState<DashboardMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [userGroups, setUserGroups] = useState<string[]>([])

  const fetchUserGroups = useCallback(async () => {
    try {
      const userGroups = await fetchUserGroupsAction(currentUserId);
      setUserGroups(userGroups);
    } catch (error) {
      console.error('Error fetching user groups:', error);
      setUserGroups([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  const fetchMatches = useCallback(async () => {    
    try {
        if (userGroups.length === 0) {
            setUpcomingMatches([]);
            setPastMatches([]);
            setLoading(false);
            return;
        }

        const { upcoming, past } = await fetchMatchesAction(userGroups);

        // Transform keys to match DashboardMatch interface
        const transformMatch = (match: any): DashboardMatch => ({
            id: match.id,
            date_time: match.dateTime,
            location: match.location,
            max_players_per_team: match.maxPlayersPerTeam,
            planned_teams: match.plannedTeams,
            teams_created: match.teamsCreated,
            teams_finalized: match.teamsFinalized,
            created_at: match.createdAt,
            created_by: match.createdBy,
            groups: {
                id: match.groupId,
                name: '', // Placeholder, as group name is not fetched here
            },
            teams: [], // Placeholder, as teams are not fetched here
        });

        setUpcomingMatches(upcoming.map(transformMatch).slice(0, 3));
        setPastMatches(past.map(transformMatch).slice(0, 3));
    } catch (error) {
        console.error('Error fetching matches:', error);
        setUpcomingMatches([]);
        setPastMatches([]);
    } finally {
        setLoading(false);
    }
  }, [userGroups]);

  const handleJoinLeave = async (match: DashboardMatch) => {
    // Prevent join/leave if teams are created or finalized
    if (match.teams_created || match.teams_finalized) {
      if (match.teams_finalized) {
        toast.warning('Cannot join/leave - match teams are finalized!')
      } else {
        toast.warning('Cannot join/leave - teams have been created!')
      }
      return
    }

    const userInMatch = await checkUserInMatch(match)

    try {
      // Get current user's team_player record for this group
      const { id: teamPlayerId } = await getTeamPlayerAction(currentUserId, match.groups.id) || {};

      if (!teamPlayerId) return false;

      if (userInMatch) {
        // Leave match - remove from match_players
        await deleteMatchPlayerAction(teamPlayerId, match.id);

        // Also remove from waiting list
        await deleteFromWaitingListAction(match.id, teamPlayerId);

        toast.success('Successfully left the match!')
      } else {
        // Join match - check if there's space
        const totalSpots = match.planned_teams * match.max_players_per_team;
        const currentPlayers = match.match_players?.length || 0;

        if (currentPlayers < totalSpots) {
          // Space available - register directly to match
          try {
            await addMatchPlayerAction({
              matchId: match.id,
              teamPlayerId,
              teamId: null,
              guestName: null,
            });
            toast.success("Successfully joined the match! You'll be assigned to a team when teams are created.");
          } catch (joinError) {
            console.error("Error joining match:", joinError);
            toast.error("Error joining the match.");
          }
        } else {
          // Match is full, join waiting list
          try {
            await addToWaitingListAction({
              matchId: match.id,
              teamPlayerId,
            });
            toast.info("Match is full! You have been added to the waiting list.");
          } catch (waitingError) {
            console.error("Error adding to waiting list:", waitingError);
            toast.error("Error adding to the waiting list.");
          }
        }
      }

      fetchMatches() // Refresh data
    } catch (error: any) {
      console.error('Error joining/leaving match:', error)
      toast.error('Error: ' + error.message)
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
      const { id: teamPlayerId } = await getTeamPlayerAction(currentUserId, match.groups.id) || {};

      if (!teamPlayerId) return false;

      // Check if user is in this match (either assigned to team or registered directly)
      const isUserInMatch = await checkUserInMatchAction(teamPlayerId, match.id);
      return isUserInMatch;
    } catch (error) {
      return false
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
              Dashboard
            </h1>
            <p className="text-gray-600">Welcome back! Here&apos;s what&apos;s happening with your football groups.</p>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600">Welcome back! Here&apos;s what&apos;s happening with your football groups.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Matches */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Matches */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Upcoming Matches</h3>
                <a
                  href="/groups"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  View All →
                </a>
              </div>
              {upcomingMatches.length === 0 ? (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-8 text-center">
                  <div className="text-4xl mb-3">⚽</div>
                  <p className="text-gray-600 font-medium">No upcoming matches in your groups</p>
                  <p className="text-sm text-gray-500 mt-2">Join a group or create a match to get started!</p>
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
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Recent Matches</h3>
                  <a
                    href="/groups"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                  >
                    View All →
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

  const matchDate = new Date(match.date_time)
  const isToday = matchDate.toDateString() === new Date().toDateString()
  const numberOfTeams = match.teams?.length || match.planned_teams
  const totalSpots = numberOfTeams * match.max_players_per_team
  const currentPlayers = match.match_players?.length || 0
  const isLocked = match.teams_created || match.teams_finalized

  const handleJoinLeave = async () => {
    setLoading(true)
    await onJoinLeave()
    const isUserInMatch = await checkUserInMatchAction(currentUserId, match.id);
    setUserInMatch(isUserInMatch); // Refresh status
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

  useEffect(() => {
    const fetchUserInMatch = async () => {
      const isUserInMatch = await checkUserInMatchAction(currentUserId, match.id);
      setUserInMatch(isUserInMatch);
    }
    fetchUserInMatch();
  }, [currentUserId, match.id]);

  return (
    <div className={`bg-white/90 backdrop-blur-sm border rounded-xl p-4 transition-all shadow-md hover:shadow-lg ${
      isUpcoming 
        ? isToday 
          ? 'border-green-300 bg-gradient-to-br from-green-50 to-blue-50 ring-2 ring-green-200' 
          : 'border-gray-200 hover:border-blue-300'
        : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
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
          className="flex-1 px-3 py-2 text-sm bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all text-center font-medium shadow-md hover:shadow-lg"
        >
          View Details
        </a>
        {isUpcoming && (
          <button 
            onClick={handleJoinLeave}
            disabled={loading || isLocked}
            className={`flex-1 px-3 py-2 text-sm rounded-lg transition-all font-medium shadow-md hover:shadow-lg ${
              isLocked
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : userInMatch 
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800' 
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
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
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserGroups = useCallback(async () => {
    try {
      const data = await fetchUserGroupsWithDetailsAction(currentUserId);
      setUserGroups(data || []);
    } catch (error) {
      console.error('Error fetching user groups:', error);
      setUserGroups([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchUserGroups();
  }, [fetchUserGroups]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Your Groups</h3>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">Your Groups</h3>
        <a
          href="/groups"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
        >
          View All →
        </a>
      </div>

      {userGroups.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-gray-600 font-medium mb-4">You haven&apos;t joined any groups yet</p>
          <p className="text-sm text-gray-500 mb-6">Join or create a group to start organizing matches!</p>
          <a
            href="/groups"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all text-sm font-medium shadow-md hover:shadow-lg"
          >
            Browse Groups
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {userGroups.slice(0, 3).map((membership: any) => (
            <div key={membership.groups.id} className="p-4 border border-gray-200 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-green-50 transition-all hover:border-blue-300 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 truncate">
                    {membership.groups.name}
                  </h4>
                  {membership.groups.description && (
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {membership.groups.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      membership.groups.privacy === 'public' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {membership.groups.privacy === 'public' ? '🌐 Public' : '🔒 Private'}
                    </span>
                  </div>
                </div>
                <a
                  href={`/groups/${membership.groups.id}`}
                  className="ml-4 px-4 py-2 text-sm bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all font-medium shadow-md hover:shadow-lg"
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
                className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                View {userGroups.length - 3} more groups →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}