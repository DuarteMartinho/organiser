'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import GroupsList from './groups-list'
import CreateGroupForm from './create-group-form'
import JoinGroupForm from './join-group-form'

interface GroupsPageClientProps {
  userId: string
}

interface GroupStats {
  totalGroups: number
  adminRoles: number
  upcomingMatches: number
}

export default function GroupsPageClient({ userId }: GroupsPageClientProps) {
  const [activeTab, setActiveTab] = useState<'myGroups' | 'create' | 'join'>('myGroups')
  const [stats, setStats] = useState<GroupStats>({ totalGroups: 0, adminRoles: 0, upcomingMatches: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchStats = useCallback(async () => {
    try {
      // Get total groups
      const { count: totalGroups } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Get admin roles
      const { count: adminRoles } = await supabase
        .from('group_admins')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Get upcoming matches for user's groups
      const { data: userGroups } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId)

      let upcomingMatches = 0
      if (userGroups && userGroups.length > 0) {
        const now = new Date()
        const { count } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .in('group_id', userGroups.map((g: { group_id: string }) => g.group_id))
          .gt('date_time', now.toISOString()) // Use gt (greater than) instead of gte (greater than or equal)

        upcomingMatches = count || 0
      }

      setStats({
        totalGroups: totalGroups || 0,
        adminRoles: adminRoles || 0,
        upcomingMatches
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, supabase])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const handleTabSuccess = () => {
    setActiveTab('myGroups')
    fetchStats() // Refresh stats when new group is created/joined
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard" 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Dashboard
              </Link>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Football Groups
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">{/* Changed py-8 to pt-8 pb-16 for more bottom space */}
        {/* Page Description */}
        <div className="mb-8">
          <p className="text-gray-600">
            Manage your groups, create new ones, or join existing groups
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg border shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('myGroups')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'myGroups'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Groups
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'create'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Create Group
              </button>
              <button
                onClick={() => setActiveTab('join')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'join'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Join Group
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-8">
          {activeTab === 'myGroups' && (
            <div>
              <GroupsList onTabChange={setActiveTab} />
            </div>
          )}

          {activeTab === 'create' && (
            <CreateGroupForm 
              onSuccess={handleTabSuccess}
            />
          )}

          {activeTab === 'join' && (
            <JoinGroupForm 
              onSuccess={handleTabSuccess}
            />
          )}
        </div>

        {/* Quick Stats */}
        {activeTab === 'myGroups' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">⚽</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Groups Joined</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '-' : stats.totalGroups}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">🏆</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Admin Roles</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '-' : stats.adminRoles}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-bold">📅</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Upcoming Matches</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '-' : stats.upcomingMatches}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}