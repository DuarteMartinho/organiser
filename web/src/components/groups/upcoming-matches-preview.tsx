'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchMatchesByGroupAction } from '@/actions/matches/fetch-matches-by-group'

interface Match {
  id: string
  dateTime: Date | string
  location: string | null
  maxPlayersPerTeam: number | null
  plannedTeams: number | null
  matchPlayers?: Array<{
    id: string
    teamPlayerId: string | null
    guestName: string | null
  }>
}

interface UpcomingMatchesPreviewProps {
  groupId: string
  onHasMatches?: (hasMatches: boolean) => void
}

export default function UpcomingMatchesPreview({ 
  groupId,
  onHasMatches
}: UpcomingMatchesPreviewProps) {
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMatches = useCallback(async () => {
    try {
      const data = await fetchMatchesByGroupAction(groupId)
      const now = new Date()
      const upcoming = data
        .filter(match => {
          const matchDate = match.dateTime instanceof Date ? match.dateTime : new Date(match.dateTime)
          return matchDate > now
        })
        .slice(0, 3) // Show only next 3 upcoming matches
      
      setUpcomingMatches(upcoming)
      onHasMatches?.(upcoming.length > 0)
    } catch (error) {
      console.error('Error fetching matches:', error)
      setUpcomingMatches([])
      onHasMatches?.(false)
    } finally {
      setLoading(false)
    }
  }, [groupId, onHasMatches])

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  if (loading || upcomingMatches.length === 0) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-200 p-6 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-2xl">⚽</span>
          Next Upcoming Matches
        </h3>
        <span className="text-sm text-gray-500">
          {upcomingMatches.length} match{upcomingMatches.length !== 1 ? 'es' : ''}
        </span>
      </div>
      
      <div className="space-y-3">
        {upcomingMatches.map((match) => {
          const matchDate = match.dateTime instanceof Date ? match.dateTime : new Date(match.dateTime)
          const isToday = matchDate.toDateString() === new Date().toDateString()
          const numberOfTeams = match.plannedTeams || 2
          const maxTotalPlayers = numberOfTeams * (match.maxPlayersPerTeam || 11)
          const currentPlayers = match.matchPlayers?.length || 0

          return (
            <div 
              key={match.id} 
              className={`p-4 rounded-lg border transition-colors ${
                isToday 
                  ? 'bg-green-100 border-green-300' 
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  {isToday && (
                    <span className="inline-block px-2 py-0.5 text-xs bg-green-600 text-white rounded-full mb-2">
                      Today
                    </span>
                  )}
                  <p className="font-medium text-gray-900">
                    📅 {matchDate.toLocaleDateString()} at {matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {match.location && (
                    <p className="text-sm text-gray-600 mt-1">📍 {match.location}</p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    👥 {currentPlayers}/{maxTotalPlayers} players registered
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
