'use client'

import { useState } from 'react'
import GroupHeader from './group-header'
import GroupMatches from './group-matches'
import GroupAdminTab from './group-admin-tab'
import GroupMembers from './group-members'
import GuestManager from './guest-manager'

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
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Group Header */}
        <GroupHeader 
          group={group}
          isAdmin={isAdmin}
          userId={userId}
          onGroupUpdated={handleGroupUpdated}
        />

        {/* Tab Navigation */}
        <div className="mt-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
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
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
                    {activeTab === 'matches' && (
            <div>
              <GroupMatches 
                groupId={group.id}
                isAdmin={isAdmin}
                currentUserId={userId}
              />
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-6">              
              <GroupMembers 
                key={`members-${refreshKey}`} // Force re-render when refreshKey changes
                groupId={group.id}
                isAdmin={isAdmin}
                currentUserId={userId}
                groupOwnerId={groupOwnerId}
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
                isOwner={userId === groupOwnerId}
                onGroupUpdated={handleGroupUpdated}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}