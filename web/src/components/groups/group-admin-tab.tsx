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

  const exportPlayersData = async (format: 'csv' | 'json') => {
    setExporting(true)
    try {
      // First, get all group members with user data
      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select(`
          joined_at,
          user_id,
          users (
            id,
            name,
            email
          )
        `)
        .eq('group_id', group.id)

      if (membersError) throw membersError

      // Then get team player data for all users in the group
      const userIds = members?.map((member: any) => member.user_id) || []
      const { data: teamPlayers, error: teamPlayersError } = await supabase
        .from('team_players')
        .select('user_id, rating, is_key_player, preferred_position, role, created_at')
        .eq('group_id', group.id)
        .in('user_id', userIds)

      if (teamPlayersError) throw teamPlayersError

      // Create a map of user_id to team player data for easier lookup
      const teamPlayerMap = new Map()
      teamPlayers?.forEach((tp: any) => {
        teamPlayerMap.set(tp.user_id, tp)
      })

      // Include all members (regular users and guests) and format the data
      const playersData = members
        ?.filter((member: any) => member.users) // Only filter out null users
        .map((member: any) => {
          const teamPlayerData = teamPlayerMap.get(member.user_id)
          const isGuest = member.users.email.includes('@temp.local')
          
          return {
            name: member.users.name,
            email: member.users.email,
            player_type: isGuest ? 'Guest' : 'Member',
            joined_at: new Date(member.joined_at).toLocaleDateString(),
            rating: teamPlayerData?.rating || 5,
            preferred_position: teamPlayerData?.preferred_position || 'MID',
            is_key_player: teamPlayerData?.is_key_player || false,
            role: teamPlayerData?.role || 'player'
          }
        }) || []

      const filename = `${group.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_players_${new Date().toISOString().split('T')[0]}`

      if (format === 'csv') {
        // Convert to CSV
        const headers = ['Name', 'Email', 'Player Type', 'Joined Date', 'Rating', 'Position', 'Key Player', 'Role']
        const csvContent = [
          headers.join(','),
          ...playersData.map(player => [
            `"${player.name}"`,
            `"${player.email}"`,
            `"${player.player_type}"`,
            `"${player.joined_at}"`,
            player.rating,
            `"${player.preferred_position}"`,
            player.is_key_player ? 'Yes' : 'No',
            `"${player.role}"`
          ].join(','))
        ].join('\\n')

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `${filename}.csv`
        link.click()
      } else {
        // Convert to JSON
        const jsonContent = JSON.stringify({
          group: {
            name: group.name,
            id: group.id,
            exported_at: new Date().toISOString()
          },
          players: playersData
        }, null, 2)

        // Download JSON
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `${filename}.json`
        link.click()
      }

      alert(`Successfully exported ${playersData.length} players to ${format.toUpperCase()}`)
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
      const text = await file.text()
      let playersData: any[] = []

      if (file.name.endsWith('.csv')) {
        // Parse CSV
        const lines = text.split('\n').filter(line => line.trim())
        if (lines.length < 2) throw new Error('CSV file appears to be empty or invalid')
        
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase())
        const requiredHeaders = ['name', 'email']
        
        if (!requiredHeaders.every(header => headers.includes(header))) {
          throw new Error('CSV must contain at least "name" and "email" columns')
        }

        playersData = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.replace(/"/g, '').trim())
          const player: any = {}
          
          headers.forEach((header, i) => {
            const value = values[i] || ''
            switch (header) {
              case 'name':
                player.name = value
                break
              case 'email':
                player.email = value
                break
              case 'rating':
                player.rating = parseInt(value) || 5
                break
              case 'position':
              case 'preferred_position':
                player.preferred_position = ['GK', 'DEF', 'MID', 'FWD'].includes(value.toUpperCase()) ? value.toUpperCase() : 'MID'
                break
              case 'key_player':
              case 'is_key_player':
                player.is_key_player = value.toLowerCase() === 'yes' || value.toLowerCase() === 'true'
                break
              case 'role':
                player.role = ['player', 'admin'].includes(value.toLowerCase()) ? value.toLowerCase() : 'player'
                break
            }
          })
          
          if (!player.name || !player.email) {
            throw new Error(`Row ${index + 2}: Name and email are required`)
          }
          
          return player
        })
      } else if (file.name.endsWith('.json')) {
        // Parse JSON
        const jsonData = JSON.parse(text)
        playersData = jsonData.players || jsonData
        
        if (!Array.isArray(playersData)) {
          throw new Error('JSON file must contain an array of players or have a "players" property')
        }
      } else {
        throw new Error('Only CSV and JSON files are supported')
      }

      // Validate and import players in batches to prevent memory issues
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []
      const batchSize = 50 // Process 50 players at a time

      for (let i = 0; i < playersData.length; i += batchSize) {
        const batch = playersData.slice(i, i + batchSize)
        
        for (const playerData of batch) {
        try {
          if (!playerData.name || !playerData.email) {
            errors.push(`Skipped player: Missing name or email`)
            errorCount++
            continue
          }

          // Check if user already exists
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', playerData.email)
            .single()

          let userId = existingUser?.id

          if (!userId) {
            // Create new user
            const { data: newUser, error: userError } = await supabase
              .from('users')
              .insert({
                name: playerData.name,
                email: playerData.email
              })
              .select('id')
              .single()

            if (userError) throw userError
            userId = newUser.id
          }

          // Check if already a group member
          const { data: existingMember } = await supabase
            .from('group_members')
            .select('user_id')
            .eq('group_id', group.id)
            .eq('user_id', userId)
            .single()

          if (!existingMember) {
            // Add to group
            const { error: memberError } = await supabase
              .from('group_members')
              .insert({
                group_id: group.id,
                user_id: userId
              })

            if (memberError) throw memberError
          }

          // Create or update team player profile
          const { error: teamPlayerError } = await supabase
            .from('team_players')
            .upsert({
              user_id: userId,
              group_id: group.id,
              rating: Math.min(Math.max(playerData.rating || 5, 1), 10),
              preferred_position: playerData.preferred_position || 'MID',
              is_key_player: playerData.is_key_player || false,
              role: playerData.role || 'player'
            }, {
              onConflict: 'user_id,group_id'
            })

          if (teamPlayerError) throw teamPlayerError
          successCount++
        } catch (error) {
          console.error('Error importing player:', error)
          errors.push(`Failed to import ${playerData.name || playerData.email}: ${error}`)
          errorCount++
        }
      }
      
      // Add a small delay between batches to prevent memory pressure
      if (i + batchSize < playersData.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

      // Show results
      let message = `Import completed: ${successCount} players added successfully`
      if (errorCount > 0) {
        message += `, ${errorCount} errors`
        if (errors.length > 0) {
          message += '\\n\\nErrors:\\n' + errors.slice(0, 5).join('\\n')
          if (errors.length > 5) {
            message += `\\n... and ${errors.length - 5} more errors`
          }
        }
      }
      alert(message)

      // Refresh stats
      fetchGroupStats()
      setShowImportModal(false)
    } catch (error) {
      console.error('Import error:', error)
      alert(`Failed to import players: ${error}`)
    } finally {
      setImporting(false)
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
          isAdmin={isAdmin}
          />
      </div>
      )}

      {/* Export Data */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
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