import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import GroupPageClient from '@/components/groups/group-page-client'

interface GroupPageProps {
  params: Promise<{
    id: string
  }>
}

interface GroupData {
  id: string
  name: string
  description: string | null
  privacy: string
  created_at: string
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Please sign in to view this group.</p>
        </div>
      </div>
    )
  }

  // Get group data
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('id', id)
    .single()

  if (groupError || !group) {
    notFound()
  }

  // Check if user is a member
  const { data: membership } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You are not a member of this group.</p>
          <a 
            href="/dashboard"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    )
  }

  // Check if user is admin
  const { data: adminData } = await supabase
    .from('group_admins')
    .select('*')
    .eq('group_id', id)
    .eq('user_id', user.id)
    .single()

  const isAdmin = !!adminData

  // Get the group owner (first admin chronologically)
  const { data: ownerData } = await supabase
    .from('group_admins')
    .select('user_id, created_at')
    .eq('group_id', id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()
  
  const groupOwnerId = ownerData?.user_id

  return (
    <GroupPageClient
      initialGroup={group}
      isAdmin={isAdmin}
      userId={user.id}
      groupOwnerId={groupOwnerId}
    />
  )
}