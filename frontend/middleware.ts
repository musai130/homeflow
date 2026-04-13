import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const protectedRoutes = ['/subscription', '/schedule', '/billing', '/profile', '/me', '/customer', '/cleaner', '/admin'];

const roleRoutes: Array<{ prefix: string; roles: Array<'user' | 'cleaner' | 'admin'> }> = [
  { prefix: '/customer', roles: ['user', 'admin'] },
  { prefix: '/cleaner', roles: ['cleaner', 'admin'] },
  { prefix: '/admin', roles: ['admin'] },
];

function roleHome(role?: string): string {
  if (role === 'cleaner') return '/cleaner';
  if (role === 'admin') return '/admin';
  return '/profile';
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get('accessToken')?.value;
  const role = request.cookies.get('userRole')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  const matched = roleRoutes.find(
    (item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`),
  );

  if (matched && (!role || !matched.roles.includes(role as 'user' | 'cleaner' | 'admin'))) {
    return NextResponse.redirect(new URL(roleHome(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
