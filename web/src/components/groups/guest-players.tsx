'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'
import UserDetailsSidebar from './user-details-sidebar'

interface Guest {
  group_id: string
  user_id: string
  joined_at: string
  users: {
    name: string
    email: string
  }
  isAdmin: boolean
}

interface GuestPlayersProps {
  groupId: string
  isAdmin: boolean
  currentUserId: string
  groupOwnerId?: string
}

export default function GuestPlayers({ groupId, isAdmin, currentUserId, groupOwnerId }: GuestPlayersProps) {
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchGuests = useCallback(async () => {
    try {
      console.log('Fetching guests for group:', groupId)
      
      if (!groupId) {
        throw new Error('Group ID is required')
      }

      // Get basic member data
      const { data: basicMembers, error: basicError } = await supabase
        .from('group_members')
        .select('group_id, user_id, joined_at')
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true })
        .limit(100)

      if (basicError) {
        throw new Error(`Failed to fetch basic members: ${basicError.message}`)
      }

      if (!basicMembers || basicMembers.length === 0) {
        console.log('No members found for this group')
        setGuests([])
        return
      }

      // Get user details for each member
  const userIds = basicMembers.map((member: any) => member.user_id)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds)

      if (usersError) {
        throw new Error(`Failed to fetch user details: ${usersError.message}`)
      }

      // Get admin list
      const { data: adminData, error: adminError } = await supabase
        .from('group_admins')
        .select('user_id')
        .eq('group_id', groupId)
        .limit(20)

      if (adminError) {
        console.warn('Admin query error (non-fatal):', adminError)
      }

      const adminIds = adminData?.map((admin: any) => admin.user_id) || []

      // Combine all data
      const usersMap = usersData?.reduce((acc: any, user: any) => {
        acc[user.id] = user
        return acc
      }, {}) || {}

      const membersWithDetails = basicMembers?.map((member: any) => {
        const userDetails = usersMap[member.user_id]
        if (!userDetails) {
          console.warn(`User details not found for user_id: ${member.user_id}`)
          return null
        }
        
        return {
          ...member,
          users: {
            name: userDetails.name || 'Unknown User',
            email: userDetails.email || 'No email'
          },
          isAdmin: adminIds.includes(member.user_id)
        }
      }).filter(Boolean) || []

      // Filter for ONLY guest users (those with temporary emails)
      const guestMembers = membersWithDetails.filter((member: any) => 
        member.users.email.includes('@temp.local')
      )

      console.log('Guest members found:', guestMembers)
      setGuests(guestMembers)
    } catch (error) {
      console.error('Error fetching guests:', error)
      setGuests([])
    } finally {
      setLoading(false)
    }
  }, [groupId, supabase])

  useEffect(() => {
    // Only fetch guests if the user is an admin
    if (isAdmin) {
      fetchGuests()
    }
  }, [fetchGuests, isAdmin])

  // Only show to admins (rendered after hooks to satisfy rules-of-hooks)
  if (!isAdmin) return null

  if (loading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Guest Players</h3>
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Guest Players</h3>
            <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
              Admin Only
            </span>
          </div>
          <span className="text-sm text-gray-500">
            {guests.length} guest{guests.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="space-y-3">
          {guests.map((guest) => (
            <div 
              key={`${guest.group_id}-${guest.user_id}`} 
              onClick={() => setSelectedUserId(guest.user_id)}
              className="flex items-center justify-between p-3 border rounded-md hover:bg-orange-50 cursor-pointer transition-colors border-orange-200"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900">{guest.users.name}</h4>
                  <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-800 rounded-full">
                    Guest
                  </span>
                </div>
                <p className="text-sm text-gray-600">{guest.users.email}</p>
                <p className="text-xs text-gray-500">
                  Added: {mounted ? new Date(guest.joined_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'Loading...'}
                </p>
              </div>

              <div className="text-orange-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {guests.length === 0 && (
          <div className="text-center py-6">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No guest players added yet.</p>
            <p className="text-xs text-gray-400 mt-1">Use the Guest Manager above to add temporary players</p>
          </div>
        )}

        {/* Hint for admins */}
        {guests.length > 0 && (
          <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-xs text-orange-800">
              🎭 Guest players are temporary members who don&apos;t need app accounts. Click to manage them.
            </p>
          </div>
        )}
      </div>

      {/* User Details Sidebar for Guests */}
      <UserDetailsSidebar
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
        userId={selectedUserId || ''}
        groupId={groupId}
        isCurrentUserAdmin={isAdmin}
        groupOwnerId={groupOwnerId}
        currentUserId={currentUserId}
        onMemberUpdate={fetchGuests}
      />
    </>
  )
}