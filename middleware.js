import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Add routes that require authentication
// You can use * for wildcards
const protectedRoutes = [
    '/triage',
    '/dashboard',
    '/profile',
    '/reports',
    '/medication'
];

// Routes that are public (optional, for explicit exclusion logic if needed)
const publicRoutes = [
    '/login',
    '/register',
    '/signup',
    '/',
    '/api/auth/login',
    '/api/auth/register'
];

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    // Check if the current route is protected
    const isProtectedRoute = protectedRoutes.some(route =>
        pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isProtectedRoute) {
        const token = request.cookies.get('token')?.value;

        if (!token) {
            // Redirect to login if no token
            const url = new URL('/login', request.url);
            url.searchParams.set('callbackUrl', encodeURI(pathname));
            return NextResponse.redirect(url);
        }

        try {
            // Verify JWT
            const secret = new TextEncoder().encode(JWT_SECRET);
            await jwtVerify(token, secret);

            // Token is valid, proceed
            return NextResponse.next();
        } catch (error) {
            // Token invalid or expired
            const url = new URL('/login', request.url);
            url.searchParams.set('callbackUrl', encodeURI(pathname));
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes, except those we might want to protect later)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
