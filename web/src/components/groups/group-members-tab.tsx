'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'

interface SupabaseMember {
  id: string
  joined_at: string
  users: {
    id: string
    name: string
    email: string
  }[] | null // This also comes as an array from Supabase
  team_players: {
    rating: number
    preferred_position: string
    is_key_player: boolean
  }[] // This comes as an array from Supabase
}

interface GroupMember {
  id: string
  joined_at: string
  users: {
    id: string
    name: string
    email: string
  }
  team_players: {
    rating: number
    preferred_position: string
    is_key_player: boolean
  }
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
  const supabase = createClient()

  const fetchMembers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          id,
          joined_at,
          users (
            id,
            name,
            email
          ),
          team_players!inner (
            rating,
            preferred_position,
            is_key_player
          )
        `)
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true })

      if (error) throw error
      // Transform and filter the data
      const validMembers: GroupMember[] = (data as SupabaseMember[] || [])
        .filter((member) => 
          member.users && 
          member.users.length > 0 &&
          member.team_players && 
          member.team_players.length > 0
        )
        .map((member) => ({
          id: member.id,
          joined_at: member.joined_at,
          users: member.users![0], // Take the first users record
          team_players: member.team_players[0] // Take the first team_players record
        }))
      setMembers(validMembers)
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }, [groupId, supabase])

  const fetchAdmins = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('group_admins')
        .select('user_id')
        .eq('group_id', groupId)

      if (error) throw error
      setAdmins(data?.map((admin: { user_id: string }) => admin.user_id) || [])
    } catch (error) {
      console.error('Error fetching admins:', error)
    }
  }, [groupId, supabase])

  useEffect(() => {
    fetchMembers()
    fetchAdmins()
  }, [fetchMembers, fetchAdmins])

  const filteredMembers = members.filter(member =>
    member.users.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.users.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getMemberRole = (userId: string) => {
    if (userId === groupOwnerId) return 'Owner'
    if (admins.includes(userId)) return 'Admin'
    return 'Member'
  }

  const getPositionColor = (position: string) => {
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