/**
 * Server Action Authentication Helper
 * 
 * Provides authentication checking for server actions
 */

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export async function getAuthenticatedUser() {
    const headersList = await headers();

    try {
        const session = await auth.api.getSession({
            headers: headersList
        });

        if (!session?.user) {
            throw new Error('Unauthorized: No active session');
        }

        return session.user;
    } catch (error) {
        console.error('Authentication error:', error);
        throw new Error('Authentication failed');
    }
}

export async function requireAuth() {
    const user = await getAuthenticatedUser();

    if (!user || !user.id) {
        throw new Error('Unauthorized: User ID not found');
    }

    return user;
}
