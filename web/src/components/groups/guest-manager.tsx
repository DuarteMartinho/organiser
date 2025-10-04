'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'
import UserDetailsSidebar from './user-details-sidebar'

interface Guest {
  group_id: string
  user_id: string
  joined_at: string
  users: {
    name: string
    email: string
  }
  isAdmin: boolean
}

interface GuestManagerProps {
  groupId: string
  isAdmin: boolean
  currentUserId: string
  groupOwnerId?: string
  onGuestAdded?: () => void
}

export default function GuestManager({ groupId, isAdmin, currentUserId, groupOwnerId, onGuestAdded }: GuestManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [loading, setLoading] = useState(false)
  const [guests, setGuests] = useState<Guest[]>([])
  const [guestsLoading, setGuestsLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchGuests = useCallback(async () => {
    try {
      if (!groupId) return

      // Get basic member data
      const { data: basicMembers, error: basicError } = await supabase
        .from('group_members')
        .select('group_id, user_id, joined_at')
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true })
        .limit(100)

      if (basicError) throw basicError

      if (!basicMembers || basicMembers.length === 0) {
        setGuests([])
        return
      }

      // Get user details
      const userIds = basicMembers.map((member: any) => member.user_id)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds)

      if (usersError) throw usersError

      // Get admin list
      const { data: adminData } = await supabase
        .from('group_admins')
        .select('user_id')
        .eq('group_id', groupId)
        .limit(20)

      const adminIds = adminData?.map((admin: any) => admin.user_id) || []

      // Combine data
      const usersMap = usersData?.reduce((acc: any, user: any) => {
        acc[user.id] = user
        return acc
      }, {}) || {}

      const membersWithDetails = basicMembers?.map((member: any) => {
        const userDetails = usersMap[member.user_id]
        if (!userDetails) return null
        
        return {
          ...member,
          users: {
            name: userDetails.name || 'Unknown User',
            email: userDetails.email || 'No email'
          },
          isAdmin: adminIds.includes(member.user_id)
        }
      }).filter(Boolean) || []

      // Filter for ONLY guest users
      const guestMembers = membersWithDetails.filter((member: any) => 
        member.users.email.includes('@temp.local')
      )

      setGuests(guestMembers)
    } catch (error) {
      console.error('Error fetching guests:', error)
      setGuests([])
    } finally {
      setGuestsLoading(false)
    }
  }, [groupId, supabase])

  useEffect(() => {
    fetchGuests()
  }, [fetchGuests])

  // Filter guests based on search term
  const filteredGuests = guests.filter(guest => 
    guest.users.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const addGuest = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!guestName.trim()) {
      alert('Please enter a guest name')
      return
    }

    setLoading(true)
    try {
      // Generate email from the name
      const generatedEmail = `${guestName.trim().toLowerCase().replace(/\s+/g, '.')}.guest-${Date.now()}@temp.local`

      // Create a guest user record
      const { data: guestUser, error: userError } = await supabase
        .from('users')
        .insert({
          name: guestName.trim(),
          email: generatedEmail,
        })
        .select()
        .single()

      if (userError) throw userError

      // Add guest to group members
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: guestUser.id,
        })

      if (memberError) throw memberError

      // Create team player profile
      const { error: teamPlayerError } = await supabase
        .from('team_players')
        .insert({
          user_id: guestUser.id,
          group_id: groupId,
          role: 'player',
          rating: 5,
          preferred_position: 'MID',
        })

      if (teamPlayerError) throw teamPlayerError

      // Reset form
      setGuestName('')
      setIsOpen(false)
      
      // Refresh lists
      fetchGuests()
      onGuestAdded?.()
      
      alert(`Guest "${guestName}" added successfully!`)
    } catch (error: any) {
      console.error('Error adding guest:', error)
      alert('Error adding guest: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Guest Management</h3>
          <button
            onClick={() => setIsOpen(true)}
            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
          >
            Add Guest
          </button>
        </div>

        {/* Current Guests List */}
        {guestsLoading ? (
          <p className="text-gray-500 text-sm">Loading guests...</p>
        ) : guests.length > 0 ? (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Current Guests</h4>
              <span className="text-sm text-gray-500">
                {filteredGuests.length} guest{filteredGuests.length !== 1 ? 's' : ''}
                {searchTerm && ` (${guests.length} total)`}
              </span>
            </div>
            
            {/* Search Input for Guests */}
            <div className="mb-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search guests by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredGuests.length > 0 ? (
                filteredGuests.map((guest) => (
                  <div 
                    key={`${guest.group_id}-${guest.user_id}`} 
                    onClick={() => setSelectedUserId(guest.user_id)}
                    className="flex items-center justify-between p-3 border rounded-md hover:bg-orange-50 cursor-pointer transition-colors border-orange-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium text-gray-900">{guest.users.name}</h5>
                        <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-800 rounded-full">
                          Guest
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Added: {mounted ? new Date(guest.joined_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) : 'Loading...'}
                      </p>
                    </div>
                    <div className="text-orange-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">No guests found matching {`"${searchTerm}"`}</p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-blue-600 hover:text-blue-800 text-xs mt-1"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mb-4 text-center py-4">
            <p className="text-gray-500 text-sm">No guest players added yet.</p>
          </div>
        )}

        {/* Guest addition form */}
        {isOpen && (
          <div className="border-t pt-4 mt-4">
            <form onSubmit={addGuest} className="space-y-4">
              <div>
                <label htmlFor="guestName" className="block text-sm font-medium text-gray-700 mb-1">
                  Guest Name *
                </label>
                <input
                  type="text"
                  id="guestName"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder={"Enter guest\u2019s full name"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email will be automatically generated
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? 'Adding...' : 'Add Guest'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false)
                    setGuestName('')
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tips */}
        {!isOpen && (
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="text-blue-500 mt-0.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-blue-800 font-medium">Guest Player Tips</p>
                <ul className="text-xs text-blue-700 mt-1 space-y-1">
                  <li>• Guests can be added to matches like regular members</li>
                  <li>• They won&apos;t receive notifications or have app access</li>
                  <li>• Click on guests above to manage them</li>
                  <li>• Use for one-time players or visitors</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Details Sidebar for Guests */}
      <UserDetailsSidebar
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
        userId={selectedUserId || ''}
        groupId={groupId}
        isCurrentUserAdmin={isAdmin}
        groupOwnerId={groupOwnerId}
        currentUserId={currentUserId}
        onMemberUpdate={fetchGuests}
      />
    </>
  )
}