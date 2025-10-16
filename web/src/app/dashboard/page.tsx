import { requireAuth } from '@/lib/auth/server'
import AuthButtonClient from '@/components/auth/auth-button-client'
import Dashboard from '@/components/dashboard'
import Link from 'next/link'
import { Trophy, Users } from 'lucide-react'

export default async function DashboardPage() {
  const session = await requireAuth()
  const user = session.user

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Modern Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 group">
                <Trophy className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  Football Organiser
                </span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/groups" 
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors rounded-lg hover:bg-blue-50"
              >
                <Users className="h-5 w-5" />
                <span>My Groups</span>
              </Link>
              <AuthButtonClient />
            </div>
          </div>
        </div>
      </header>

      <main>
        <Dashboard currentUserId={user.id} />
      </main>
    </div>
  )
}