import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

const COOKIE_NAME = 'zs_token';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes
  if (pathname === '/login' || pathname === '/' || pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // All API routes: check token but return 401 JSON (not redirect)
  if (pathname.startsWith('/api/')) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const user = verifyToken(token);

  if (!user) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  // Role-based route protection
  if (pathname.startsWith('/admin') && user.role !== 'admin') {
    return NextResponse.redirect(new URL(`/${user.role}`, request.url));
  }

  if (pathname.startsWith('/collaborator') && user.role !== 'collaborator') {
    if (user.role === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
    return NextResponse.redirect(new URL('/client', request.url));
  }

  if (pathname.startsWith('/client') && user.role !== 'client') {
    if (user.role === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
    return NextResponse.redirect(new URL('/collaborator', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)'],
};
