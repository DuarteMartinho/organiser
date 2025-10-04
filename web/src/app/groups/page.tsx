import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GroupsPageClient from '@/components/groups/groups-page-client'

export default async function GroupsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/')
  }

  return <GroupsPageClient userId={user.id} />
}