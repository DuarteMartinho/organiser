'use client'

import { useState } from 'react'
import GroupHeader from './group-header'
import GroupMatches from './group-matches'
import GroupAdminTab from './group-admin-tab'
import GroupMembers from './group-members'
import GuestManager from './guest-manager'
import UpcomingMatchesPreview from './upcoming-matches-preview'
import UserDetailsSidebar from './user-details-sidebar'

interface GroupPageClientProps {
  initialGroup: {
    id: string
    name: string
    description: string | null
    privacy: string
    created_at: string
  }
  isAdmin: boolean
  userId: string
  groupOwnerId?: string
}

export default function GroupPageClient({ 
  initialGroup, 
  isAdmin, 
  userId, 
  groupOwnerId 
}: GroupPageClientProps) {
  const [group, setGroup] = useState(initialGroup)
  const [activeTab, setActiveTab] = useState<'matches' | 'members' | 'admin'>('matches')
  const [refreshKey, setRefreshKey] = useState(0)
  const [hasUpcomingMatches, setHasUpcomingMatches] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const handleGroupUpdated = (updatedGroup: any) => {
    setGroup(updatedGroup)
  }

  const handleGuestAdded = () => {
    // Trigger refresh of members list
    setRefreshKey(prev => prev + 1)
  }

  const tabs = [
    { id: 'matches', name: 'Matches', icon: '⚽' },
    { id: 'members', name: 'Members', icon: '👥' },
    ...(isAdmin ? [{ id: 'admin', name: 'Admin', icon: '⚙️' }] : [])
  ] as const

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Group Header */}
        <GroupHeader 
          group={group}
          isAdmin={isAdmin}
          userId={userId}
          onGroupUpdated={handleGroupUpdated}
        />

        {/* Upcoming Matches Preview - Only shown if there are upcoming matches */}
        <div className="mt-8">
          <UpcomingMatchesPreview 
            groupId={group.id}
            onHasMatches={setHasUpcomingMatches}
          />
        </div>

        {/* Tab Navigation */}
        <div className={hasUpcomingMatches ? 'mt-8' : 'mt-8'}>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg">
            <nav className="flex space-x-8 px-6 border-b border-gray-200" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{tab.icon}</span>
                    {tab.name}
                  </span>
                </button>
              ))}
            </nav>

            {/* Tab Content with gap */}
            <div className="p-6">
              {activeTab === 'matches' && (
                <GroupMatches 
                  groupId={group.id}
                  isAdmin={isAdmin}
                  currentUserId={userId}
                />
              )}

              {activeTab === 'members' && (
                <div className="space-y-6">              
                  <GroupMembers 
                    key={`members-${refreshKey}`} // Force re-render when refreshKey changes
                    groupId={group.id}
                    isAdmin={isAdmin}
                    currentUserId={userId}
                    groupOwnerId={groupOwnerId}
                    onSelectUser={setSelectedUserId}
                  />
                  
                  {/* Guest Manager - Only for Admins */}
                  {isAdmin && (
                    <GuestManager 
                      groupId={group.id}
                      isAdmin={isAdmin}
                      currentUserId={userId}
                      groupOwnerId={groupOwnerId}
                      onGuestAdded={handleGuestAdded}
                    />
                  )}
                </div>
              )}

              {activeTab === 'admin' && isAdmin && (
                <div className="space-y-6">
                  <GroupAdminTab
                    group={group}
                    isAdmin={isAdmin}
                    isOwner={userId === groupOwnerId}
                    onGroupUpdated={handleGroupUpdated}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* User Details Sidebar - Rendered outside tab container for full-page overlay */}
      <UserDetailsSidebar
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
        userId={selectedUserId || ''}
        groupId={group.id}
        isCurrentUserAdmin={isAdmin}
        groupOwnerId={groupOwnerId}
        currentUserId={userId}
        onMemberUpdate={() => setRefreshKey(prev => prev + 1)}
      />
    </div>
  )
}