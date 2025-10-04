'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'
import UserDetailsSidebar from './user-details-sidebar'
import UserEditModal from './user-edit-modal'

interface Member {
  group_id: string
  user_id: string
  joined_at: string
  users: {
    name: string
    email: string
  }
  isAdmin: boolean
}

interface GroupMembersProps {
  groupId: string
  isAdmin: boolean
  currentUserId: string
  groupOwnerId?: string
}

export default function GroupMembers({ groupId, isAdmin, currentUserId, groupOwnerId }: GroupMembersProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchMembers = useCallback(async () => {
    try {
      console.log('Fetching members for group:', groupId)
      
      // Check if groupId is valid
      if (!groupId) {
        throw new Error('Group ID is required')
      }

      // First, let's test basic connectivity
      const { data: testData, error: testError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)
        .limit(1)

      console.log('Basic connectivity test:', { testData, testError })

      if (testError) {
        throw new Error(`Database connection failed: ${testError.message}`)
      }

      // Now try the full query step by step
      // Step 1: Get basic member data without users join
      const { data: basicMembers, error: basicError } = await supabase
        .from('group_members')
        .select('group_id, user_id, joined_at')
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true })
        .limit(50)

      console.log('Basic members query:', { basicMembers, basicError })

      if (basicError) {
        throw new Error(`Failed to fetch basic members: ${basicError.message}`)
      }

      if (!basicMembers || basicMembers.length === 0) {
        console.log('No members found for this group')
        setMembers([])
        return
      }

      // Step 2: Get user details for each member
      const userIds = basicMembers.map((member: any) => member.user_id)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds)

      console.log('Users query:', { usersData, usersError })

      if (usersError) {
        throw new Error(`Failed to fetch user details: ${usersError.message}`)
      }

      // Step 3: Get admin list
      const { data: adminData, error: adminError } = await supabase
        .from('group_admins')
        .select('user_id')
        .eq('group_id', groupId)
        .limit(20)

      console.log('Admin query result:', { adminData, adminError })

      // Don't fail if admin query fails, just warn
      if (adminError) {
        console.warn('Admin query error (non-fatal):', adminError)
      }

      const adminIds = adminData?.map((admin: any) => admin.user_id) || []

      // Step 4: Combine all data
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
      }).filter(Boolean) || [] // Remove null entries

      // Filter out guest users (those with temporary emails)
      const nonGuestMembers = membersWithDetails.filter((member: any) => 
        !member.users.email.includes('@temp.local')
      )

      console.log('Final members with details (excluding guests):', nonGuestMembers)
      setMembers(nonGuestMembers)
    } catch (error) {
      console.error('Error fetching members:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        groupId,
        errorType: typeof error,
        errorString: String(error)
      })
      setMembers([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }, [groupId, supabase])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  // Filter members based on search term
  const filteredMembers = members.filter(member => 
    member.users.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.users.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Members</h3>
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Members</h3>
          <span className="text-sm text-gray-500">
            {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
            {searchTerm && ` (${members.length} total)`}
          </span>
        </div>

        {/* Search Input */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search members by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredMembers.map((member) => (
            <div 
              key={`${member.group_id}-${member.user_id}`} 
              onClick={() => setSelectedUserId(member.user_id)}
              className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900">{member.users.name}</h4>
                  {member.user_id === groupOwnerId ? (
                    <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full">
                      Owner
                    </span>
                  ) : member.isAdmin ? (
                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                      Admin
                    </span>
                  ) : null}
                  {member.user_id === currentUserId && (
                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                      You
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{member.users.email}</p>
                <p className="text-xs text-gray-500">
                  Joined: {mounted ? new Date(member.joined_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'Loading...'}
                </p>
              </div>

              <div className="text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-6">
            {searchTerm ? (
              <div>
                <p className="text-gray-500 text-sm">No members found matching {`"${searchTerm}"`}</p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-blue-600 hover:text-blue-800 text-xs mt-1"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No members found.</p>
            )}
          </div>
        )}

        {/* Hint for admins */}
        {isAdmin && filteredMembers.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              💡 Click on any member to view their details and manage their permissions
            </p>
          </div>
        )}
      </div>

      {/* User Details Sidebar */}
      <UserDetailsSidebar
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
        userId={selectedUserId || ''}
        groupId={groupId}
        isCurrentUserAdmin={isAdmin}
        groupOwnerId={groupOwnerId}
        currentUserId={currentUserId}
        onMemberUpdate={fetchMembers}
      />
    </>
  )
}