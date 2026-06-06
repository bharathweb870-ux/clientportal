import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function getDashboardAuth(pathname: string): { cookie: string; login: string } | null {
    if (pathname.startsWith('/admin')) return { cookie: 'admin_token', login: '/login/admin' };
    if (pathname.startsWith('/agent')) return { cookie: 'agent_token', login: '/login/agent' };
    if (pathname.startsWith('/client')) return { cookie: 'client_token', login: '/login/client' };
    return null;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public paths
    if (pathname === '/login' || pathname.startsWith('/login/') || pathname.startsWith('/payment/')) {
        return NextResponse.next();
    }

    const dashboardAuth = getDashboardAuth(pathname);
    if (dashboardAuth && !request.cookies.has(dashboardAuth.cookie)) {
        return NextResponse.redirect(new URL(dashboardAuth.login, request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
