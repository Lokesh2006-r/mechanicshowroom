import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const session = request.cookies.get('session');
    const { pathname } = request.nextUrl;

    // Allow static files and API routes (unless API needs protection too, keeping it simple for now)
    if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname === '/favicon.ico') {
        return NextResponse.next();
    }

    // Login Pages Logic
    if (pathname.startsWith('/login')) {
        // If user is already logged in, redirect to dashboard
        if (session) {
            return NextResponse.redirect(new URL('/', request.url));
        }
        // Allow access to login pages
        return NextResponse.next();
    }

    // Protected Routes Logic (Dashboard, Customers, Billing, etc.)
    if (!session) {
        // Redirect unauthenticated requests to the role selection page
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Role-based Access Control
    try {
        const user = JSON.parse(session.value);

        // Protect /admin routes - Only 'admin' role allowed
        if (pathname.startsWith('/admin')) {
            if (user.role !== 'admin') {
                console.warn(`Unauthorized access attempt to /admin by ${user.username} (${user.role})`);
                // Redirect employees to main dashboard
                return NextResponse.redirect(new URL('/', request.url));
            }
        }

        // Allow access
        return NextResponse.next();
    } catch (e) {
        // Invalid session cookie -> clear and redirect
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('session');
        return response;
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
