'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import InviteManager from './invite-manager'

interface Group {
  id: string
  name: string
  description: string | null
  created_at: string
  privacy: string
}

interface GroupAdminTabProps {
  group: Group
  isOwner: boolean
  onGroupUpdated: (updatedGroup: Group) => void
}

export default function GroupAdminTab({ 
  group, 
  isOwner, 
  onGroupUpdated 
}: GroupAdminTabProps) {
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    name: group.name,
    description: group.description || '',
    privacy: group.privacy || 'private',
  })
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [stats, setStats] = useState({
    totalMatches: 0,
    totalMembers: 0,
    upcomingMatches: 0
  })
  
  const supabase = createClient()
  const router = useRouter()

  const fetchGroupStats = useCallback(async () => {
    try {
      // Get total matches
      const { count: matchCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id)

      // Get total members
      const { count: memberCount } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id)

      // Get upcoming matches
      const now = new Date()
      const { count: upcomingCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id)
        .gt('date_time', now.toISOString()) // Use gt instead of gte

      setStats({
        totalMatches: matchCount || 0,
        totalMembers: memberCount || 0,
        upcomingMatches: upcomingCount || 0
      })
    } catch (error) {
      console.error('Error fetching group stats:', error)
    }
  }, [group.id, supabase])

  useEffect(() => {
    fetchGroupStats()
  }, [fetchGroupStats])

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('groups')
        .update({
          name: formData.name,
          description: formData.description || null,
          privacy: formData.privacy || 'private',
        })
        .eq('id', group.id)
        .select()
        .single()

      if (error) throw error

      onGroupUpdated(data)
      setEditMode(false)
    } catch (error) {
      console.error('Error updating group:', error)
      alert('Failed to update group. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteGroup = async () => {
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', group.id)

      if (error) throw error

      router.push('/dashboard')
    } catch (error) {
      console.error('Error deleting group:', error)
      alert('Failed to delete group. Please try again.')
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: group.name,
      description: group.description || '',
        privacy: group.privacy || 'private',
    })
    setEditMode(false)
  }

  return (
    <div className="space-y-6">
      {/* Group Statistics */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.totalMembers}</div>
            <div className="text-sm text-blue-600">Total Members</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{stats.totalMatches}</div>
            <div className="text-sm text-green-600">Total Matches</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.upcomingMatches}</div>
            <div className="text-sm text-orange-600">Upcoming Matches</div>
          </div>
        </div>
      </div>

      {/* Group Settings */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Group Settings</h3>
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Edit Settings
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{group.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            {editMode ? (
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{group.description || 'No description'}</p>
            )}
          </div>

          {/* Privacy Settings */}
          <div className="space-y-3">
            <div className="flex items-center">
              {editMode ? (
                <input
                  type="checkbox"
                  id="is_private"
                  checked={formData.privacy === 'private'}
                  onChange={(e) => setFormData({ ...formData, privacy: e.target.checked ? 'private' : 'public' })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              ) : (
                <div className={`h-4 w-4 rounded ${group.privacy === 'private' ? 'bg-blue-600' : 'bg-gray-300'} flex items-center justify-center`}>
                  {group.privacy === 'private' && <span className="text-white text-xs">✓</span>}
                </div>
              )}
              <label htmlFor="is_private" className="ml-2 text-sm text-gray-700">
                Private Group (invite-only)
              </label>
            </div>
          </div>

          {/* Group Info */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Group created on {new Date(group.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Invite Manager - Only for Private Groups */}
      {group.privacy === 'private' && (
      <div className="bg-white rounded-lg border shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Invitations</h3>
          <InviteManager 
          groupId={group.id}
          groupName={group.name}
          isAdmin={isOwner}
          />
      </div>
      )}

      {/* Danger Zone */}
      {isOwner && (
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-red-800">Delete Group</h4>
                <p className="text-sm text-red-600 mt-1">
                  Permanently delete this group and all its matches. This action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Group</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {`"${group.name}"`}? This will permanently delete all matches,
              member data, and cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}