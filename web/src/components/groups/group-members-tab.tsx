'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchGroupMembersWithDetailsAction } from '@/actions/group-members/fetch-members-with-details'
import { fetchGroupAdminsAction } from '@/actions/group-members/fetch-group-admins'

interface GroupMember {
  id: string
  joinedAt: Date | null
  users: {
    id: string | null
    name: string | null
    email: string | null
  }
  teamPlayers: {
    rating: number | null
    preferredPosition: string | null
    isKeyPlayer: boolean
  }
  isAdmin?: boolean
}

interface GroupMembersTabProps {
  groupId: string
  isAdmin: boolean
  currentUserId: string
  groupOwnerId?: string
}

export default function GroupMembersTab({ 
  groupId, 
  isAdmin, 
  currentUserId, 
  groupOwnerId 
}: GroupMembersTabProps) {
  const [members, setMembers] = useState<GroupMember[]>([])
  const [admins, setAdmins] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchMembers = useCallback(async () => {
    try {
      const data = await fetchGroupMembersWithDetailsAction(groupId)
      setMembers(data)
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }, [groupId])

  const fetchAdmins = useCallback(async () => {
    try {
      const adminIds = await fetchGroupAdminsAction(groupId)
      setAdmins(adminIds)
    } catch (error) {
      console.error('Error fetching admins:', error)
    }
  }, [groupId])

  useEffect(() => {
    fetchMembers()
    fetchAdmins()
  }, [fetchMembers, fetchAdmins])

  const filteredMembers = members.filter((member: GroupMember) =>
    member.users.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.users.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getMemberRole = (userId: string | null) => {
    if (!userId) return 'Member'
    if (userId === groupOwnerId) return 'Owner'
    if (admins.includes(userId)) return 'Admin'
    return 'Member'
  }

  const getPositionColor = (position: string | null) => {
    switch (position) {
      case 'GK': return 'bg-yellow-100 text-yellow-800'
      case 'DEF': return 'bg-blue-100 text-blue-800'
      case 'MID': return 'bg-green-100 text-green-800'
      case 'FWD': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <p className="text-gray-500">Loading members...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      
    </div>
  )
}