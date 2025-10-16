import { requireAuth } from '@/lib/auth/server'
import GroupsPageClient from '@/components/groups/groups-page-client'

export default async function GroupsPage() {
  const session = await requireAuth()

  return <GroupsPageClient userId={session.user.id} />
}