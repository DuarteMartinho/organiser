'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'

interface JoinGroupFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

interface Group {
  id: string
  name: string
  description: string | null
  privacy: string
  created_at: string
}

export default function JoinGroupForm({ onSuccess, onCancel }: JoinGroupFormProps) {
  const [activeTab, setActiveTab] = useState<'public' | 'invite'>('public')
  const [inviteCode, setInviteCode] = useState('')
  const [publicGroups, setPublicGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const fetchPublicGroups = useCallback(async () => {
    setLoadingGroups(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get public groups that user is not already a member of
      const { data: userGroups } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)

      const userGroupIds = userGroups?.map((g: any) => g.group_id) || []

      let query = supabase
        .from('groups')
        .select('*')
        .eq('privacy', 'public')
        .order('created_at', { ascending: false })

      // Only add the NOT IN filter if user has groups
      if (userGroupIds.length > 0) {
        query = query.not('id', 'in', `(${userGroupIds.join(',')})`)
      }

      const { data: groups, error } = await query

      if (error) throw error
      setPublicGroups(groups || [])
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoadingGroups(false)
    }
  }, [supabase])

  const joinGroup = async (groupId: string) => {
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Ensure user exists in our users table
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown',
          email: user.email!,
        })

      if (userError) throw userError

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single()

      if (existingMember) {
        throw new Error('You are already a member of this group')
      }

      // Check if user has leftover team_player data (from previous membership)
      const { data: existingTeamPlayer } = await supabase
        .from('team_players')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single()

      // Clean up any leftover data before rejoining
      if (existingTeamPlayer) {
        // Remove old team_player record
        await supabase
          .from('team_players')
          .delete()
          .eq('group_id', groupId)
          .eq('user_id', user.id)

        // Remove any leftover admin privileges
        await supabase
          .from('group_admins')
          .delete()
          .eq('group_id', groupId)
          .eq('user_id', user.id)
      }

      // Add user as member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
        })

      if (memberError) {
        if (memberError.code === '23505') {
          throw new Error('You are already a member of this group')
        }
        throw memberError
      }

      // Create new team_player profile (always as regular player when rejoining)
      const { error: teamPlayerError } = await supabase
        .from('team_players')
        .insert({
          user_id: user.id,
          group_id: groupId,
          role: 'player', // Always start as player, admin can promote later
          rating: 5, // Reset to default rating
          is_key_player: false, // Reset key player status
          preferred_position: 'MID', // Reset to default position
        })

      if (teamPlayerError) throw teamPlayerError

      onSuccess?.()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const joinByInviteCode = async () => {
    if (!inviteCode.trim()) return

    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check if user exists and ensure they're in our users table
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown',
          email: user.email!,
        })

      if (userError) throw userError

      // Find the invite code
      const { data: invite, error: inviteError } = await supabase
        .from('group_invites')
        .select(`
          *,
          groups (
            id,
            name,
            privacy
          )
        `)
        .eq('code', inviteCode.trim().toUpperCase())
        .eq('is_active', true)
        .single()

      if (inviteError || !invite) {
        throw new Error('Invalid or expired invite code')
      }

      // Check if invite is expired
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        throw new Error('This invite code has expired')
      }

      // Check if invite has reached max uses
      if (invite.max_uses !== -1 && invite.used_count >= invite.max_uses) {
        throw new Error('This invite code has reached its maximum uses')
      }

      // Check if user is banned from this group
      const { data: ban } = await supabase
        .from('group_bans')
        .select('id')
        .eq('group_id', invite.group_id)
        .eq('user_id', user.id)
        .single()

      if (ban) {
        throw new Error('You are banned from this group')
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', invite.group_id)
        .eq('user_id', user.id)
        .single()

      if (existingMember) {
        throw new Error('You are already a member of this group')
      }

      // Check for leftover team_player data and clean it up
      const { data: existingTeamPlayer } = await supabase
        .from('team_players')
        .select('id')
        .eq('group_id', invite.group_id)
        .eq('user_id', user.id)
        .single()

      if (existingTeamPlayer) {
        // Clean up leftover data
        await supabase
          .from('team_players')
          .delete()
          .eq('group_id', invite.group_id)
          .eq('user_id', user.id)

        await supabase
          .from('group_admins')
          .delete()
          .eq('group_id', invite.group_id)
          .eq('user_id', user.id)
      }

      // Join the group
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: invite.group_id,
          user_id: user.id,
        })

      if (memberError) throw memberError

      // Create team_player profile (reset to defaults)
      const { error: teamPlayerError } = await supabase
        .from('team_players')
        .insert({
          user_id: user.id,
          group_id: invite.group_id,
          role: 'player',
          rating: 5,
          is_key_player: false,
          preferred_position: 'MID',
        })

      if (teamPlayerError) throw teamPlayerError

      // Update invite usage count
      const { error: updateError } = await supabase
        .from('group_invites')
        .update({ 
          used_count: invite.used_count + 1 
        })
        .eq('id', invite.id)

      if (updateError) console.warn('Failed to update invite usage:', updateError)

      // Clear form and close
      setInviteCode('')
      onSuccess?.()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Load public groups when tab switches to public
  useEffect(() => {
    if (activeTab === 'public') {
      fetchPublicGroups()
    }
  }, [activeTab, fetchPublicGroups])

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Join Group</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b mb-4">
        <button
          onClick={() => setActiveTab('public')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'public'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Browse Public Groups
        </button>
        <button
          onClick={() => setActiveTab('invite')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'invite'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Join with Invite Code
        </button>
      </div>

      {/* Public Groups Tab */}
      {activeTab === 'public' && (
        <div>
          {loadingGroups ? (
            <p className="text-gray-500">Loading public groups...</p>
          ) : publicGroups.length === 0 ? (
            <p className="text-gray-500">No public groups available to join.</p>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {publicGroups.map((group) => (
                <div key={group.id} className="p-3 border rounded-md hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{group.name}</h4>
                      {group.description && (
                        <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                      )}
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full mt-2 inline-block">
                        Public
                      </span>
                    </div>
                    <button
                      onClick={() => joinGroup(group.id)}
                      disabled={loading}
                      className="ml-3 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                    >
                      {loading ? 'Joining...' : 'Join'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invite Code Tab */}
      {activeTab === 'invite' && (
        <div>
          <div className="mb-4">
            <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-2">
              Enter Invite Code
            </label>
            <input
              type="text"
              id="inviteCode"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Enter 8-character invite code (e.g., ABC12345)"
              maxLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get the invite code from a group admin (8 characters)
            </p>
          </div>
          
          <button
            onClick={joinByInviteCode}
            disabled={loading || !inviteCode.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Joining...' : 'Join Group'}
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-4 mt-4 border-t">
        <button
          onClick={() => fetchPublicGroups()}
          disabled={loadingGroups}
          className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
        >
          Refresh
        </button>
        
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}