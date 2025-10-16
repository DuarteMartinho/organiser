'use client'

import { authClient } from '@/lib/auth-client'
import { useState, useEffect, useCallback } from 'react'
import { fetchInvitesAction } from '@/actions/invites/fetch-invites'
import { createInviteAction } from '@/actions/invites/create-invite'
import { deactivateInviteAction } from '@/actions/invites/deactivate-invite'
import { useToast } from '@/hooks/useToast'

interface GroupInvite {
  id: string
  code: string
  maxUses: number | null
  usedCount: number | null
  expiresAt: Date | null
  isActive: boolean | null
  createdAt: Date | null
}

interface InviteManagerProps {
  groupId: string
  groupName: string
  isAdmin: boolean
}

export default function InviteManager({ groupId, groupName, isAdmin }: InviteManagerProps) {
  const toast = useToast()
  const [invites, setInvites] = useState<GroupInvite[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Form state
  const [maxUses, setMaxUses] = useState(1)
  const [expirationHours, setExpirationHours] = useState(24)
  const [hasExpiration, setHasExpiration] = useState(true)

  const generateInviteCode = () => {
    // Generate a secure, user-friendly code
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789' // No confusing chars like O, 0, I, 1
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const createInvite = async () => {
    setCreating(true)
    try {
      const { data: session } = await authClient.getSession()
      if (!session?.user) throw new Error('Not authenticated')

      const code = generateInviteCode()
      const expiresAt = hasExpiration 
        ? new Date(Date.now() + expirationHours * 60 * 60 * 1000)
        : null

      await createInviteAction({
        groupId,
        createdBy: session.user.id,
        code,
        maxUses,
        expiresAt
      })

      await fetchInvites()
      setShowCreateForm(false)
      
      // Reset form
      setMaxUses(1)
      setExpirationHours(24)
      setHasExpiration(true)
      toast.success('Invite code created successfully!')
    } catch (error: any) {
      toast.error('Error creating invite: ' + error.message)
    } finally {
      setCreating(false)
    }
  }

  const deactivateInvite = async (inviteId: string) => {
    try {
      await deactivateInviteAction(inviteId)
      await fetchInvites()
      toast.success('Invite deactivated successfully!')
    } catch (error: any) {
      toast.error('Error deactivating invite: ' + error.message)
    }
  }

  const fetchInvites = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchInvitesAction(groupId)
      setInvites(data)
    } catch (error: any) {
      console.error('Error fetching invites:', error)
      setInvites([])
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    if (isAdmin) {
      fetchInvites()
    }
  }, [fetchInvites, isAdmin])

  if (!isAdmin) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">Only group admins can manage invites.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Invite Codes for {groupName}</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          Create New Invite
        </button>
      </div>

      {showCreateForm && (
        <div className="p-4 border rounded-lg bg-gray-50">
          <h4 className="font-medium mb-3">Create New Invite Code</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Uses
              </label>
              <select
                value={maxUses}
                onChange={(e) => setMaxUses(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value={1}>1 use (single invite)</option>
                <option value={5}>5 uses</option>
                <option value={10}>10 uses</option>
                <option value={25}>25 uses</option>
                <option value={-1}>Unlimited</option>
              </select>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={hasExpiration}
                  onChange={(e) => setHasExpiration(e.target.checked)}
                />
                <span className="text-sm font-medium text-gray-700">Set expiration</span>
              </label>
            </div>

            {hasExpiration && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expires in (hours)
                </label>
                <select
                  value={expirationHours}
                  onChange={(e) => setExpirationHours(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value={1}>1 hour</option>
                  <option value={6}>6 hours</option>
                  <option value={24}>24 hours</option>
                  <option value={72}>3 days</option>
                  <option value={168}>1 week</option>
                </select>
              </div>
            )}

            <div className="flex space-x-2">
              <button
                onClick={createInvite}
                disabled={creating}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                {creating ? 'Creating...' : 'Create Invite'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading invites...</p>
      ) : (
        <div className="space-y-2">
          {invites.length === 0 ? (
            <p className="text-gray-500 text-sm">No invite codes created yet.</p>
          ) : (
            invites.map((invite) => (
              <div key={invite.id} className="p-3 border rounded-md bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono font-bold">
                        {invite.code}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(invite.code)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Used: {invite.usedCount ?? 0}/{invite.maxUses === -1 ? '∞' : invite.maxUses ?? 0}
                      {invite.expiresAt && (
                        <span className="ml-2">
                          Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      invite.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {invite.isActive ? 'Active' : 'Inactive'}
                    </span>
                    
                    {invite.isActive && (
                      <button
                        onClick={() => deactivateInvite(invite.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}