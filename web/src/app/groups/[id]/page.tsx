import { getCurrentUser } from '@/lib/auth/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import GroupPageClient from '@/components/groups/group-page-client'
import { fetchGroupPageDataAction } from '@/actions/groups/fetch-group-page-data'

interface GroupPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center max-w-md border border-gray-200">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Access Denied</h1>
          <p className="text-gray-600 mb-6">Please sign in to view this group.</p>
          <Link 
            href="/auth"
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-md hover:shadow-lg"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  // Fetch group data using Drizzle
  const groupData = await fetchGroupPageDataAction(id, user.id)

  if (!groupData) {
    notFound()
  }

  const { group, isMember, isAdmin, groupOwnerId } = groupData

  if (!isMember) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center max-w-md border border-gray-200">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Access Denied</h1>
          <p className="text-gray-600 mb-6">You are not a member of this group.</p>
          <Link 
            href="/dashboard"
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-md hover:shadow-lg"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <GroupPageClient
      initialGroup={group}
      isAdmin={isAdmin}
      userId={user.id}
      groupOwnerId={groupOwnerId}
    />
  )
}