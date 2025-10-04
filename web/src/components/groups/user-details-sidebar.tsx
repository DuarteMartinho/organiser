'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'
import UserEditModal from './user-edit-modal'

interface UserDetailsSidebarProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  groupId: string
  isCurrentUserAdmin: boolean
  groupOwnerId?: string
  currentUserId: string
  onMemberUpdate: () => void
}

interface UserDetails {
  id: string
  name: string
  email: string
  joined_at: string
  teamPlayer: {
    rating: number
    is_key_player: boolean
    preferred_position: string
    role: string
    created_at: string
  } | null
  isAdmin: boolean
  matchStats: {
    totalMatches: number
    goals: number
    assists: number
  }
}

export default function UserDetailsSidebar({
  isOpen,
  onClose,
  userId,
  groupId,
  isCurrentUserAdmin,
  groupOwnerId,
  currentUserId,
  onMemberUpdate
}: UserDetailsSidebarProps) {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchUserDetails = useCallback(async () => {
    if (!isOpen || !userId) return

    setLoading(true)
    
    try {
      // Get user basic info and membership
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select(`
          group_id,
          user_id,
          joined_at,
          users!inner (
            id,
            name,
            email
          )
        `)
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single()

      console.log('Member data result:', { memberData, memberError })
      if (memberError) throw new Error(`Member query failed: ${memberError.message}`)

      // Get team player info
      const { data: teamPlayerData, error: teamPlayerError } = await supabase
        .from('team_players')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single()

      console.log('Team player data result:', { teamPlayerData, teamPlayerError })
      // Don't throw error if no team player record exists
      if (teamPlayerError && teamPlayerError.code !== 'PGRST116') {
        console.warn('Team player query error (non-fatal):', teamPlayerError)
      }

      // Check if user is admin
      const { data: adminData, error: adminError } = await supabase
        .from('group_admins')
        .select('user_id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single()

      console.log('Admin data result:', { adminData, adminError })
      // Don't throw error if user is not an admin
      if (adminError && adminError.code !== 'PGRST116') {
        console.warn('Admin query error (non-fatal):', adminError)
      }

      // Get match stats - need to find team_player id first
      const teamPlayerId = teamPlayerData?.id
      let matchStatsData = null
      
      if (teamPlayerId) {
        const { data: statsData } = await supabase
          .from('player_match_stats')
          .select('goals, assists')
          .eq('team_player_id', teamPlayerId)
        matchStatsData = statsData
      }

      const totalGoals = matchStatsData?.reduce((sum: number, stat: any) => sum + (stat.goals || 0), 0) || 0
      const totalAssists = matchStatsData?.reduce((sum: number, stat: any) => sum + (stat.assists || 0), 0) || 0

      // Normalize users object (Supabase may return users as an array when using joins)
      const usersObj = Array.isArray(memberData.users) ? memberData.users[0] : (memberData.users || { id: '', name: '', email: '' })

      setUserDetails({
        id: memberData.user_id,
        name: usersObj.name,
        email: usersObj.email,
        joined_at: memberData.joined_at,
        teamPlayer: teamPlayerData,
        isAdmin: !!adminData,
        matchStats: {
          totalMatches: matchStatsData?.length || 0,
          goals: totalGoals,
          assists: totalAssists
        }
      })
      
      console.log('User details set successfully:', {
        userId: memberData.user_id,
        name: usersObj.name,
        hasTeamPlayer: !!teamPlayerData,
        isAdmin: !!adminData
      })
    } catch (error) {
      console.error('Error fetching user details:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        userId,
        groupId
      })
      setUserDetails(null)
    } finally {
      setLoading(false)
    }
  }, [isOpen, userId, groupId, supabase])

  const promoteToAdmin = async () => {
    try {
      const { error } = await supabase
        .from('group_admins')
        .insert({
          group_id: groupId,
          user_id: userId
        })

      if (error) throw error

      await supabase
        .from('team_players')
        .update({ role: 'admin' })
        .eq('group_id', groupId)
        .eq('user_id', userId)

      await fetchUserDetails()
      onMemberUpdate()
      alert('User promoted to admin successfully!')
    } catch (error: any) {
      alert('Error promoting user: ' + error.message)
    }
  }

  const demoteAdmin = async () => {
    try {
      const { error } = await supabase
        .from('group_admins')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId)

      if (error) throw error

      await supabase
        .from('team_players')
        .update({ role: 'player' })
        .eq('group_id', groupId)
        .eq('user_id', userId)

      await fetchUserDetails()
      onMemberUpdate()
      alert('Admin privileges removed successfully!')
    } catch (error: any) {
      alert('Error demoting admin: ' + error.message)
    }
  }

  const removeMember = async () => {
    if (!confirm(`Are you sure you want to remove ${userDetails?.name} from this group?`)) return

    try {
      // Clean removal process
      await supabase.from('team_players').delete().eq('group_id', groupId).eq('user_id', userId)
      await supabase.from('group_admins').delete().eq('group_id', groupId).eq('user_id', userId)
      await supabase.from('match_waiting_list').delete().eq('team_player_id', userId)
      await supabase.from('match_players').delete().eq('team_player_id', userId)
      await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId)

      onMemberUpdate()
      onClose()
      alert('Member removed successfully!')
    } catch (error: any) {
      alert('Error removing member: ' + error.message)
    }
  }

  useEffect(() => {
    let isMounted = true
    
    const loadUserDetails = async () => {
      if (isMounted && isOpen && userId) {
        await fetchUserDetails()
      }
    }
    
    loadUserDetails()
    
    return () => {
      isMounted = false
    }
  }, [isOpen, userId, groupId]) // Only depend on the actual values

  if (!isOpen) return null

  const isOwner = userId === groupOwnerId
  const isCurrentUser = userId === currentUserId
  const canManage = isCurrentUserAdmin && !isCurrentUser && !isOwner
  const canEdit = isCurrentUser || isCurrentUserAdmin || (groupOwnerId === currentUserId)
  const canEditAdvanced = isCurrentUserAdmin || (groupOwnerId === currentUserId)

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Member Details</h2>
            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  Edit
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : userDetails ? (
            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-lg mb-2">{userDetails.name}</h3>
                <p className="text-gray-600 text-sm mb-3">{userDetails.email}</p>
                
                <div className="flex flex-wrap gap-2">
                  {isOwner && (
                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                      Owner
                    </span>
                  )}
                  {userDetails.isAdmin && !isOwner && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      Admin
                    </span>
                  )}
                  {isCurrentUser && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      You
                    </span>
                  )}
                  {/* Check if this is a guest user */}
                  {userDetails.email.includes('@temp.local') && (
                    <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                      Guest
                    </span>
                  )}
                  {/* Only show Key Player tag to admins/owners */}
                  {isCurrentUserAdmin && userDetails.teamPlayer?.is_key_player && (
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                      Key Player
                    </span>
                  )}
                </div>
                
                {/* Member joined date - always visible */}
                <div className="mt-3 text-sm text-gray-500">
                  Joined: {mounted ? new Date(userDetails.joined_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'Loading...'}
                </div>
              </div>

              {/* Team Player Stats - Only visible to admins/owners */}
              {isCurrentUserAdmin && userDetails.teamPlayer && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-3">Player Profile</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Rating</span>
                      <p className="font-medium">{userDetails.teamPlayer.rating}/10</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Position</span>
                      <p className="font-medium">{userDetails.teamPlayer.preferred_position}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Role</span>
                      <p className="font-medium capitalize">{userDetails.teamPlayer.role}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Match Stats - Only visible to admins/owners */}
              {isCurrentUserAdmin && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-3">Match Statistics</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{userDetails.matchStats.totalMatches}</p>
                      <p className="text-xs text-gray-500">Matches</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{userDetails.matchStats.goals}</p>
                      <p className="text-xs text-gray-500">Goals</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{userDetails.matchStats.assists}</p>
                      <p className="text-xs text-gray-500">Assists</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Permission Messages for Regular Players */}
              {!isCurrentUserAdmin && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-blue-500 mt-1">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-blue-800 font-medium">
                        {isCurrentUser ? 'This is your profile' : 
                         isOwner ? 'Group owner cannot be managed' :
                         userDetails.isAdmin ? 'Admin profile' :
                         'Member profile'}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Only admins can view detailed member information
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Actions - Only for admins managing others */}
              {canManage && (
                <div className="space-y-3">
                  <h4 className="font-medium">Admin Actions</h4>
                  
                  {!userDetails.isAdmin ? (
                    <button
                      onClick={promoteToAdmin}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Promote to Admin
                    </button>
                  ) : (
                    <button
                      onClick={demoteAdmin}
                      className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition-colors"
                    >
                      Remove Admin Rights
                    </button>
                  )}
                  
                  <button
                    onClick={removeMember}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Remove from Group
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Failed to load user details</p>
            </div>
          )}
        </div>
      </div>

      {/* User Edit Modal */}
      {userDetails && (
        <UserEditModal
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          userId={userId}
          groupId={groupId}
          userDetails={userDetails}
          canEditAdvanced={canEditAdvanced}
          onUserUpdated={fetchUserDetails}
        />
      )}
    </>
  )
}