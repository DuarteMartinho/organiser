'use client'

import { authClient } from '@/lib/auth-client'
import { useState } from 'react'
import { createGroupAction } from '@/actions/groups/create-group';

interface CreateGroupFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export default function CreateGroupForm({ onSuccess, onCancel }: CreateGroupFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [privacy, setPrivacy] = useState<'private' | 'public'>('private')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Get current user
      const { data: session } = await authClient.getSession()
      if (!session?.user) throw new Error('Not authenticated')

      const user = session.user

      // Create the group using server action
      await createGroupAction({
        name,
        description,
        privacy,
        userId: user.id,
        userName: user.name || user.email?.split('@')[0] || 'Unknown',
        userEmail: user.email!,
      });

      // Reset form
      setName('')
      setDescription('')
      setPrivacy('private')

      onSuccess?.()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Create New Group</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Group Name *
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Sunday Football League"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Tell others about your group..."
          />
        </div>

        <div>
          <label htmlFor="privacy" className="block text-sm font-medium text-gray-700 mb-1">
            Privacy
          </label>
          <select
            id="privacy"
            value={privacy}
            onChange={(e) => setPrivacy(e.target.value as 'private' | 'public')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="private">Private - Invite only</option>
            <option value="public">Public - Anyone can join</option>
          </select>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating...' : 'Create Group'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}