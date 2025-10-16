'use client'

import { authClient } from '@/lib/auth-client'
import { useState, useEffect, useCallback } from 'react'
import { fetchPublicGroupsAction } from '@/actions/groups/fetch-public-groups';
import { joinGroupAction } from '@/actions/groups/join-group';
import { joinByInviteCodeAction } from '@/actions/invites/join-by-invite-code';

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

  const fetchPublicGroups = useCallback(async () => {
    setLoadingGroups(true)
    try {
      const { data: session } = await authClient.getSession()
      if (!session?.user) return

      // Fetch public groups using server action
      const groups = await fetchPublicGroupsAction(session.user.id);
      
      // Map to match the Group interface
      const mappedGroups = groups.map(group => ({
        ...group,
        created_at: group.createdAt?.toISOString() || new Date().toISOString(),
      }));
      
      setPublicGroups(mappedGroups || [])
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoadingGroups(false)
    }
  }, [])

  const joinGroup = async (groupId: string) => {
    setLoading(true)
    setError('')

    try {
      const { data: session } = await authClient.getSession()
      if (!session?.user) throw new Error('Not authenticated')

      const user = session.user

      // Join group using server action
      await joinGroupAction({
        groupId,
        userId: user.id,
        userName: user.name || user.email?.split('@')[0] || 'Unknown',
        userEmail: user.email!,
      });

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
      const { data: session } = await authClient.getSession()
      if (!session?.user) throw new Error('Not authenticated')

      const user = session.user

      // Join using server action
      await joinByInviteCodeAction({
        inviteCode: inviteCode.trim().toUpperCase(),
        userId: user.id,
        userName: user.name || user.email?.split('@')[0] || 'Unknown',
        userEmail: user.email!,
      });

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