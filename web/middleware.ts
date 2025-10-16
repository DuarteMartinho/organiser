import { NextResponse, type NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

export async function middleware(request: NextRequest) {
    const url = request.nextUrl.clone()

    // Check session using Better Auth
    const session = await auth.api.getSession({
        headers: request.headers
    })

    const isAuthenticated = !!session

    // Redirect authenticated users from home page to dashboard
    if (isAuthenticated && url.pathname === '/') {
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    // Redirect unauthenticated users from dashboard to home
    if (!isAuthenticated && url.pathname === '/dashboard') {
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}