import { createClient } from '@/lib/supabase/server'
import AuthButtonClient from '@/components/auth/auth-button-client'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
    </div>
  )
}