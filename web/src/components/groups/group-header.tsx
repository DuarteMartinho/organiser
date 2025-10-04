'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'

interface GroupHeaderProps {
  group: {
    id: string
    name: string
    description: string | null
    privacy: string
    created_at: string
  }
  isAdmin: boolean
  userId: string
  onGroupUpdated?: (updatedGroup: any) => void
}

interface GroupStats {
  memberCount: number
  totalMatches: number
  upcomingMatches: number
  thisMonthMatches: number
}

export default function GroupHeader({ group, isAdmin, onGroupUpdated }: GroupHeaderProps) {
  const [currentGroup, setCurrentGroup] = useState(group)
  const [stats, setStats] = useState<GroupStats>({
    memberCount: 0,
    totalMatches: 0,
    upcomingMatches: 0,
    thisMonthMatches: 0
  })
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  const supabase = createClient()

  // Fix hydration issue by only showing dates after component mounts
  useEffect(() => {
    setMounted(true)
  }, [])

  // Update current group when prop changes
  useEffect(() => {
    setCurrentGroup(group)
  }, [group])

  const handleGroupUpdated = (updatedGroup: any) => {
    setCurrentGroup(updatedGroup)
    onGroupUpdated?.(updatedGroup)
  }

  const fetchStats = useCallback(async () => {
    try {
      // Get total members excluding guests
      const { data: allMembers, error: memberError } = await supabase
        .from('group_members')
        .select(`
          user_id,
          users!inner (
            email
          )
        `)
        .eq('group_id', currentGroup.id)
        .limit(100)

      let memberCount = 0
      if (!memberError && allMembers) {
        // Filter out guests (users with @temp.local emails)
        memberCount = allMembers.filter((member: any) => 
          !member.users.email.includes('@temp.local')
        ).length
      }

      // Get match count
      const { count: totalMatches } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', currentGroup.id)

      // Simplified upcoming matches count  
      const now = new Date()
      const { count: upcomingMatches } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', currentGroup.id)
        .gt('date_time', now.toISOString()) // Use gt instead of gte, and full ISO string

      setStats({
        memberCount,
        totalMatches: totalMatches || 0,
        upcomingMatches: upcomingMatches || 0,
        thisMonthMatches: 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      setStats({
        memberCount: 0,
        totalMatches: 0,
        upcomingMatches: 0,
        thisMonthMatches: 0
      })
    } finally {
      setLoading(false)
    }
  }, [currentGroup.id, supabase])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return (
    <>
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{currentGroup.name}</h1>
              <span className={`px-3 py-1 text-sm rounded-full ${
                currentGroup.privacy === 'public' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {currentGroup.privacy.charAt(0).toUpperCase() + currentGroup.privacy.slice(1)}
              </span>
              {isAdmin && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  Admin
                </span>
              )}
            </div>
            
            {currentGroup.description && (
              <p className="text-gray-600 mt-2">{currentGroup.description}</p>
            )}
            
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
              <span>
                Created: {mounted ? new Date(currentGroup.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }) : 'Loading...'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/dashboard"
              className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Back to Dashboard
            </a>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {loading ? '...' : stats.memberCount}
            </div>
            <div className="text-sm text-gray-500">Members</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {loading ? '...' : stats.totalMatches}
            </div>
            <div className="text-sm text-gray-500">Total Matches</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {loading ? '...' : stats.upcomingMatches}
            </div>
            <div className="text-sm text-gray-500">Upcoming</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {loading ? '...' : stats.thisMonthMatches}
            </div>
            <div className="text-sm text-gray-500">This Month</div>
          </div>
        </div>
      </div>
    </>
  )
}