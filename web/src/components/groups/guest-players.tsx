'use client'

import { useState, useEffect, useCallback } from 'react'
import { UserCircle } from 'lucide-react'
import UserDetailsSidebar from './user-details-sidebar'
import { fetchGuestsAction } from '@/actions/guests/fetch-guests'

interface Guest {
  id: string
  name: string
  email: string
  joinedAt: Date | null
}

interface GuestPlayersProps {
  groupId: string
  isAdmin: boolean
  currentUserId: string
  groupOwnerId?: string
}

export default function GuestPlayers({ groupId, isAdmin, currentUserId, groupOwnerId }: GuestPlayersProps) {
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchGuests = useCallback(async () => {
    try {
      const guestsData = await fetchGuestsAction(groupId)
      setGuests(guestsData)
    } catch (error) {
      console.error('Error fetching guests:', error)
      setGuests([])
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    // Only fetch guests if the user is an admin
    if (isAdmin) {
      fetchGuests()
    }
  }, [fetchGuests, isAdmin])

  // Only show to admins (rendered after hooks to satisfy rules-of-hooks)
  if (!isAdmin) return null

  if (loading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Guest Players</h3>
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Guest Players</h3>
            <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
              Admin Only
            </span>
          </div>
          <span className="text-sm text-gray-500">
            {guests.length} guest{guests.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="space-y-3">
          {guests.map((guest) => (
            <div
              key={guest.id}
              onClick={() => setSelectedUserId(guest.id)}
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{guest.name}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <UserCircle className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <p className="text-sm text-gray-600">{guest.email}</p>
                <p className="text-xs text-gray-500">
                  Added: {mounted && guest.joinedAt ? new Date(guest.joinedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : '...'}
                </p>
              </div>
            </div>
          ))}
        </div>

        {guests.length === 0 && (
          <div className="text-center py-6">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No guest players added yet.</p>
            <p className="text-xs text-gray-400 mt-1">Use the Guest Manager above to add temporary players</p>
          </div>
        )}

        {/* Hint for admins */}
        {guests.length > 0 && (
          <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-xs text-orange-800">
              🎭 Guest players are temporary members who don&apos;t need app accounts. Click to manage them.
            </p>
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