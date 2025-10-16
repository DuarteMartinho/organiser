import AuthPageClient from '@/components/auth/auth-page-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In (Better Auth) | Football Organiser',
  description: 'Sign in to organize your football matches and manage your teams',
}

export default function AuthPage() {
  return <AuthPageClient />
}
