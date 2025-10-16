'use client'

import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface User {
  id: string
  name: string
  email: string
}

export default function AuthButton() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    authClient.getSession().then(({ data }) => {
      setUser(data?.user ?? null)
      setLoading(false)
    })
  }, [])

  const handleSignIn = async () => {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/dashboard',
    })
  }

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex flex-col space-y-2">
        <button
          disabled
          className="w-full rounded-md bg-gray-400 px-3 py-2 text-sm font-semibold text-white"
        >
          Loading...
        </button>
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-700">
          Welcome, {user.name || user.email}!
        </span>
        <button
          onClick={handleSignOut}
          className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
        >
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-2">
      <button
        onClick={handleSignIn}
        className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
      >
        Sign in with Google
      </button>
    </div>
  )
}