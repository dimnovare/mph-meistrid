import createIntlProxy from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';

import { routing } from '@/i18n/routing';

/**
 * Next 16 renamed `middleware` to `proxy` (01-app/02-guides/upgrading/version-16.md).
 * Same behaviour, node runtime only.
 */
const intl = createIntlProxy(routing);

/** Cheap presence check. Real verification happens in the admin layout and every route. */
const SESSION_COOKIE = 'mph_session';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The admin is Estonian-only and must never be locale-prefixed or indexed, so it skips
  // next-intl entirely.
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return NextResponse.next();

    // Optimistic redirect so a signed-out visitor sees the login form instead of a flash of
    // dashboard chrome. This is a UX shortcut, not the authorisation boundary — the Next
    // docs are explicit that proxy must not be relied on for auth, and it is not.
    if (!request.cookies.get(SESSION_COOKIE)) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.search = '';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  return intl(request);
}

export const config = {
  /*
   * Everything except Next internals, API routes and files with an extension.
   *
   * The double backslash is load-bearing. In a JavaScript string `'\.'` is just `.`, which
   * turns the alternative into `.*..*` — "any path of at least one character" — so the
   * negative lookahead fails for every path except `/` and the proxy never runs. That
   * silently disables locale routing entirely, with no error anywhere.
   */
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
