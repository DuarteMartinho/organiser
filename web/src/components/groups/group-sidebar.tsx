'use client'

import { useState } from 'react'
import GroupMembers from './group-members'
import GuestManager from './guest-manager'

interface GroupSidebarProps {
  groupId: string
  isAdmin: boolean
  currentUserId: string
  groupOwnerId?: string
}

export default function GroupSidebar({ groupId, isAdmin, currentUserId, groupOwnerId }: GroupSidebarProps) {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleGuestAdded = () => {
    // Trigger refresh of members list
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      {/* Group Members */}
      <GroupMembers 
        key={`members-${refreshKey}`} // Force re-render when refreshKey changes
        groupId={groupId}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
        groupOwnerId={groupOwnerId}
      />

      {/* Guest Manager - Only for Admins */}
      {isAdmin && (
        <GuestManager 
          groupId={groupId}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          groupOwnerId={groupOwnerId}
          onGuestAdded={handleGuestAdded}
        />
      )}
    </div>
  )
}