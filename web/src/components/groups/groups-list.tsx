'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useCallback } from 'react'
import InviteManager from './invite-manager'

interface Group {
  id: string
  name: string
  description: string | null
  privacy: string
  created_at: string
  isAdmin?: boolean
  isOwner?: boolean
}

export default function GroupsList() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const supabase = createClient()

  const fetchGroups = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get groups where user is a member with admin status
      const { data: memberGroups, error } = await supabase
        .from('group_members')
        .select(`
          groups (
            id,
            name,
            description,
            privacy,
            created_at
          )
        `)
        .eq('user_id', user.id)

      if (error) throw error

      // Get admin status separately
      const { data: adminGroups } = await supabase
        .from('group_admins')
        .select('group_id')
        .eq('user_id', user.id)

      const adminGroupIds = adminGroups?.map((item: any) => item.group_id) || []

      // Simplified owner detection - just check if user is admin for now
      // We'll implement proper owner detection later to avoid memory issues
      const groupsData = memberGroups
        ?.map((item: any) => {
          if (!item.groups) return null
          return {
            ...item.groups,
            isAdmin: adminGroupIds.includes(item.groups.id),
            isOwner: false // Temporarily disable owner detection
          }
        })
        .filter(Boolean) as Group[]

      setGroups(groupsData || [])
    } catch (error) {
      console.error('Error fetching groups:', error)
      setGroups([])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  if (loading) {
    return (
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">My Groups</h3>
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">My Groups</h3>
        <span className="text-sm text-gray-500">
          {groups.length} group{groups.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      {groups.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-gray-400 text-2xl">⚽</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No groups yet</h3>
          <p className="text-gray-500 text-sm mb-6">
            Create or join a group to start organizing football matches
          </p>
          <div className="flex justify-center gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Create Group
            </button>
            <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
              Join Group
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <div key={group.id} className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{group.name}</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        group.privacy === 'public' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {group.privacy}
                      </span>
                      {group.isAdmin && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {group.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{group.description}</p>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Joined {new Date(group.created_at).toLocaleDateString()}
                  </span>
                  <a 
                    href={`/groups/${group.id}`}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    View Group
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}