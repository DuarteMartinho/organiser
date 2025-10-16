'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import InviteManager from './invite-manager'
import { fetchGroupStatsAction } from '@/actions/groups/fetch-group-stats'
import { updateGroupAction } from '@/actions/groups/update-group'
import { deleteGroupAction } from '@/actions/groups/delete-group'

interface Group {
  id: string
  name: string
  description: string | null
  created_at: string
  privacy: string
}

interface GroupAdminTabProps {
  group: Group
  isAdmin: boolean
  isOwner: boolean
  onGroupUpdated: (updatedGroup: Group) => void
}

export default function GroupAdminTab({ 
  group,
  isAdmin, 
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
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  
  const router = useRouter()

  const fetchGroupStats = useCallback(async () => {
    try {
      const statsData = await fetchGroupStatsAction(group.id)
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching group stats:', error)
    }
  }, [group.id])

  useEffect(() => {
    fetchGroupStats()
  }, [fetchGroupStats])

  const handleSave = async () => {
    setSaving(true)
    try {
      const data = await updateGroupAction(group.id, {
        name: formData.name,
        description: formData.description || null,
        privacy: formData.privacy || 'private',
      })

      // Transform the data to match the expected format
      const transformedData = {
        ...data,
        created_at: data.createdAt?.toISOString() || group.created_at
      }

      onGroupUpdated(transformedData)
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
      await deleteGroupAction(group.id)
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

  const exportPlayersData = async (format: 'csv' | 'json') => {
    setExporting(true)
    try {
      // TODO: Migrate export functionality to Drizzle
      alert('Export functionality will be available soon')
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export player data. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const importPlayersData = async (file: File) => {
    setImporting(true)
    try {
      // TODO: Migrate import functionality to Drizzle
      alert('Import functionality will be available soon')
    } catch (error) {
      console.error('Import error:', error)
      alert('Failed to import player data. Please try again.')
    } finally {
      setImporting(false)
      setShowImportModal(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      importPlayersData(file)
    }
  }

  return (
    <div className="space-y-6">
      {/* Group Statistics */}
      <div>
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
      <div className="pt-6 border-t border-gray-200">
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
      <div className="pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Invitations</h3>
          <InviteManager 
          groupId={group.id}
          groupName={group.name}
          isAdmin={isAdmin}
          />
      </div>
      )}

      {/* Export Data */}
      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 my-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-800">Export Players</h4>
              <p className="text-sm text-gray-600 mt-1">
                Download member data including ratings, positions, and join dates
              </p>
            </div>
            <div className="flex gap-2">
              {/* <button
                onClick={() => exportPlayersData('csv')}
                disabled={exporting}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                {exporting ? 'Exporting...' : 'Export CSV'}
              </button> */}
              <button
                onClick={() => exportPlayersData('json')}
                disabled={exporting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {exporting ? 'Exporting...' : 'Export JSON'}
              </button>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 my-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-800">Import Players</h4>
              <p className="text-sm text-gray-600 mt-1">
                Upload a JSON file to import player data
              </p>
            </div>
            <div className="flex gap-2">
              {/* <label className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors cursor-pointer disabled:bg-gray-400">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={importing}
                  className="hidden"
                />
                {importing ? 'Importing...' : 'Import CSV'}
              </label> */}
              <label className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer disabled:bg-gray-400">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  disabled={importing}
                  className="hidden"
                />
                {importing ? 'Importing...' : 'Import JSON'}
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      {isOwner && (
        <div className="pt-6 border-t border-red-200">
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