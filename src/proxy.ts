import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';

// Next 16 renamed the `middleware` convention to `proxy`. Same request-time hook,
// same matcher semantics.
const intlProxy = createIntlMiddleware(routing);

const AUTH_COOKIE = 'pb_auth';

/** `/en/admin/...` -> `admin/...`, so the guard is locale-agnostic. */
function pathAfterLocale(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const [first, ...rest] = segments;
  return (routing.locales as readonly string[]).includes(first ?? '')
    ? rest.join('/')
    : segments.join('/');
}

export default function proxy(request: NextRequest) {
  const response = intlProxy(request);

  const route = pathAfterLocale(request.nextUrl.pathname);
  const isAdminRoute = route === 'admin' || route.startsWith('admin/');
  const isLoginRoute = route === 'admin/login';

  if (isAdminRoute && !isLoginRoute) {
    // A cheap presence check only. This cannot verify the token or the user's
    // role — the admin layout does that server-side against PocketBase, and the
    // API rules enforce it regardless of what any UI allows.
    if (!request.cookies.get(AUTH_COOKIE)?.value) {
      const locale = request.nextUrl.pathname.split('/').filter(Boolean)[0] ?? routing.defaultLocale;
      const loginUrl = new URL(`/${locale}/admin/login`, request.url);
      loginUrl.searchParams.set('next', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  // Skip Next internals, the API namespace, and anything with a file extension.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
