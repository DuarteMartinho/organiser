'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchGroupMembersAction } from '@/actions/group-members/fetch-group-members'

interface Member {
  id: string
  name: string
  email: string
  isAdmin: boolean
}

interface GroupMembersProps {
  groupId: string
  isAdmin: boolean
  currentUserId: string
  groupOwnerId?: string
  onSelectUser?: (userId: string) => void
}

export default function GroupMembers({ groupId, isAdmin, currentUserId, groupOwnerId, onSelectUser }: GroupMembersProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true)
      const membersData = await fetchGroupMembersAction(groupId)
      setMembers(membersData)
    } catch (error) {
      console.error('Error fetching members:', error)
      setMembers([])
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  // Filter members based on search term
  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-4">Members</h3>
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <>
      <div>
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
              key={member.id}
              onClick={() => onSelectUser?.(member.id)}
              className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900">{member.name}</h4>
                  {member.id === groupOwnerId ? (
                    <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full">
                      Owner
                    </span>
                  ) : member.isAdmin ? (
                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                      Admin
                    </span>
                  ) : null}
                  {member.id === currentUserId && (
                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                      You
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{member.email}</p>
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
    </>
  )
}