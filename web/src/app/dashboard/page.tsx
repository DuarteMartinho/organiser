import { createClient } from '@/lib/supabase/server'
import AuthButtonClient from '@/components/auth/auth-button-client'
import Dashboard from '@/components/dashboard'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Football Dashboard
            </h1>
            <div className="flex items-center gap-4">
              <a 
                href="/groups" 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                My Groups
              </a>
              <AuthButtonClient />
            </div>
          </div>
        </div>
      </header>

      <main>
        <Dashboard currentUserId={user!.id} />
      </main>
    </div>
  )
}