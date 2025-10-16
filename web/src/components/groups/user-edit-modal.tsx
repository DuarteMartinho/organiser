'use client'

import { useState } from 'react'
import { updateUserProfileAction } from '@/actions/user-details/update-user-profile'
import { useToast } from '@/hooks/useToast'

interface UserEditModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  groupId: string
  userDetails: {
    id: string
    name: string | null
    email: string | null
    teamPlayer: {
      rating: number | null
      isKeyPlayer: boolean | null
      preferredPosition: string | null
      role: string | null
    } | null
  }
  canEditAdvanced: boolean // true for admins/owners
  onUserUpdated: () => void
}

const POSITIONS = [
  { value: 'GK', label: 'Goalkeeper' },
  { value: 'DEF', label: 'Defender' },
  { value: 'MID', label: 'Midfielder' },
  { value: 'FWD', label: 'Forward' }
]

export default function UserEditModal({
  isOpen,
  onClose,
  userId,
  groupId,
  userDetails,
  canEditAdvanced,
  onUserUpdated
}: UserEditModalProps) {
  const toast = useToast()
  const [name, setName] = useState(userDetails.name || '')
  const [rating, setRating] = useState(userDetails.teamPlayer?.rating || 5)
  const [position, setPosition] = useState(userDetails.teamPlayer?.preferredPosition || 'MID')
  const [isKeyPlayer, setIsKeyPlayer] = useState(userDetails.teamPlayer?.isKeyPlayer || false)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  // Check if this is a guest user
  const isGuest = userDetails.email?.includes('@temp.local') || false

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.warning('Name is required')
      return
    }

    setLoading(true)
    try {
      await updateUserProfileAction({
        userId,
        name: name.trim(),
        groupId: userDetails.teamPlayer && canEditAdvanced ? groupId : undefined,
        rating: userDetails.teamPlayer && canEditAdvanced ? rating : undefined,
        preferredPosition: userDetails.teamPlayer && canEditAdvanced ? position : undefined,
        isKeyPlayer: userDetails.teamPlayer && canEditAdvanced ? isKeyPlayer : undefined,
      })

      onUserUpdated()
      onClose()
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error('Error updating profile: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset form to original values
    setName(userDetails.name || '')
    setRating(userDetails.teamPlayer?.rating || 5)
    setPosition(userDetails.teamPlayer?.preferredPosition || 'MID')
    setIsKeyPlayer(userDetails.teamPlayer?.isKeyPlayer || false)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleCancel}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {canEditAdvanced ? 'Edit Profile' : 'Edit My Profile'}
              </h2>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 border-b pb-2">Basic Information</h3>
                
                {/* Name */}
                <div>
                  <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="userName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    maxLength={100}
                  />
                </div>

                {/* Email - Read Only */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600">
                    {userDetails.email}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed
                  </p>
                </div>
              </div>

              {/* Advanced Settings - Only for admins/owners */}
              {canEditAdvanced && userDetails.teamPlayer && (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 border-b pb-2">Player Settings</h3>
                  
                  {/* Rating */}
                  <div>
                    <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">
                      Player Rating
                    </label>
                    <select
                      id="rating"
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                        <option key={num} value={num}>
                          {num}/10 {num === 1 ? '(Beginner)' : num === 5 ? '(Average)' : num === 10 ? '(Expert)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Preferred Position */}
                  <div>
                    <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred Position
                    </label>
                    <select
                      id="position"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {POSITIONS.map(pos => (
                        <option key={pos.value} value={pos.value}>
                          {pos.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Key Player */}
                  <div>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isKeyPlayer}
                        onChange={(e) => setIsKeyPlayer(e.target.checked)}
                        className="rounded border-gray-300 focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-medium text-sm">Key Player</div>
                        <div className="text-xs text-gray-500">
                          Mark as an essential player for the team
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Permission Info for regular users */}
              {!canEditAdvanced && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> You can only edit your name. 
                    Contact an admin to change player settings like rating or position.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}