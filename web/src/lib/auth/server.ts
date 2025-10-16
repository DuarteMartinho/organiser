import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Get the current session from Better Auth
 * Use this in Server Components and Server Actions
 */
export async function getSession() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return session;
}

/**
 * Get the current user from the session
 * Returns null if no session exists
 */
export async function getCurrentUser() {
    const session = await getSession();
    return session?.user ?? null;
}

/**
 * Require authentication - redirects to /auth if not authenticated
 * Use this in Server Components that require authentication
 */
export async function requireAuth() {
    const session = await getSession();

    if (!session) {
        redirect('/auth');
    }

    return session;
}

/**
 * Check if user is authenticated
 * Returns boolean without redirecting
 */
export async function isAuthenticated() {
    const session = await getSession();
    return !!session;
}
