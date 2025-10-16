'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import GroupsList from './groups-list'
import CreateGroupForm from './create-group-form'
import JoinGroupForm from './join-group-form'
import { fetchUserGroupStatsAction } from '@/actions/groups/fetch-user-group-stats'

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

  const fetchStats = useCallback(async () => {
    try {
      // Fetch stats using server action
      const stats = await fetchUserGroupStatsAction(userId)
      setStats(stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const handleTabSuccess = () => {
    setActiveTab('myGroups')
    fetchStats() // Refresh stats when new group is created/joined
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Modern Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard" 
                className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
              >
                ← Dashboard
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Football Groups
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* Page Description */}
        <div className="mb-8">
          <p className="text-lg text-gray-600">
            Manage your groups, create new ones, or join existing groups
          </p>
        </div>

        {/* Stats Cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 font-medium text-sm">Total Groups</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">{stats.totalGroups}</p>
                </div>
                <div className="text-4xl">👥</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 font-medium text-sm">Admin Roles</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">{stats.adminRoles}</p>
                </div>
                <div className="text-4xl">⚙️</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 font-medium text-sm">Upcoming Matches</p>
                  <p className="text-3xl font-bold text-purple-900 mt-1">{stats.upcomingMatches}</p>
                </div>
                <div className="text-4xl">⚽</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation & Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg">
          {/* Tab Bar */}
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

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'myGroups' && (
              <GroupsList onTabChange={setActiveTab} />
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
        </div>
      </div>
    </div>
  )
}