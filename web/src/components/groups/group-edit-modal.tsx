'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface GroupEditModalProps {
  isOpen: boolean
  onClose: () => void
  group: {
    id: string
    name: string
    description: string | null
    privacy: string
  }
  isAdmin: boolean
  onGroupUpdated: (updatedGroup: any) => void
}

export default function GroupEditModal({ 
  isOpen, 
  onClose, 
  group, 
  isAdmin, 
  onGroupUpdated 
}: GroupEditModalProps) {
  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState(group.description || '')
  const [privacy, setPrivacy] = useState(group.privacy)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  if (!isAdmin || !isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      alert('Group name is required')
      return
    }

    setLoading(true)
    try {
      const { data: updatedGroup, error } = await supabase
        .from('groups')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          privacy: privacy
        })
        .eq('id', group.id)
        .select()
        .single()

      if (error) throw error

      onGroupUpdated(updatedGroup)
      onClose()
      alert('Group updated successfully!')
    } catch (error: any) {
      console.error('Error updating group:', error)
      alert('Error updating group: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset form to original values
    setName(group.name)
    setDescription(group.description || '')
    setPrivacy(group.privacy)
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
              <h2 className="text-xl font-semibold">Edit Group</h2>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Group Name */}
              <div>
                <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  id="groupName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter group name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {name.length}/100 characters
                </p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="groupDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="groupDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your group (optional)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {description.length}/500 characters
                </p>
              </div>

              {/* Privacy Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Privacy Setting
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="privacy"
                      value="private"
                      checked={privacy === 'private'}
                      onChange={(e) => setPrivacy(e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-sm">Private</div>
                      <div className="text-xs text-gray-500">
                        Only invited members can join. Uses invite codes.
                      </div>
                    </div>
                  </label>
                  
                  <label className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="privacy"
                      value="public"
                      checked={privacy === 'public'}
                      onChange={(e) => setPrivacy(e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-sm">Public</div>
                      <div className="text-xs text-gray-500">
                        Anyone can find and join this group.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Privacy Change Warning */}
              {privacy !== group.privacy && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <div className="text-yellow-600 mt-0.5">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-yellow-800 font-medium">
                        Privacy Setting Change
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        {privacy === 'public' ? 
                          'Changing to public will allow anyone to find and join your group.' :
                          'Changing to private will require invite codes for new members.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? 'Updating...' : 'Update Group'}
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