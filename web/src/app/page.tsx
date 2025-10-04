import { createClient } from '@/lib/supabase/server'
import AuthButtonClient from '@/components/auth/auth-button-client'
import Dashboard from '@/components/dashboard'

export default async function HomePage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gray-50">
      {!user ? (
        <div className="flex min-h-screen items-center justify-center">
          <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-sm">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold">Football Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Organize football matches with your groups
              </p>
            </div>
            <AuthButtonClient />
          </div>
        </div>
      ) : (
        <>
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
            <Dashboard currentUserId={user.id} />
          </main>
        </>
      )}
    </div>
  )
}