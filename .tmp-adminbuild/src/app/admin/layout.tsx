import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { adminText } from '@/content/admin-text';
import { site } from '@/content/site';
import { currentUser } from '@/lib/auth';
import { fontVariables } from '@/lib/fonts';

import '../globals.css';

/**
 * The admin's own document.
 *
 * `src/app/layout.tsx` is a passthrough, so this layout owns `<html>` and `<body>` exactly
 * the way `src/app/[locale]/layout.tsx` does for the public site. `lang` is hard-coded to
 * `et`: the admin has one user, he is Estonian-speaking, and there is no next-intl here.
 */

export const metadata: Metadata = {
  title: adminText.dashboard.heading,
  // Belt and braces with the `X-Robots-Tag` header in next.config.ts. A private editing
  // surface has nothing to gain from being crawled and a great deal to lose.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: site.themeColor,
  // The palette has no dark variant (design-system.md §2). Without this a phone in system
  // dark mode renders dark native inputs and file pickers inside a light admin — which is
  // exactly the daylight-legibility problem the light theme exists to avoid.
  colorScheme: 'light',
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  /**
   * The authorisation boundary.
   *
   * `src/proxy.ts` also bounces a visitor with no cookie, but that is an optimistic check on
   * the cookie's *presence* — it never verifies the signature, and the Next docs are explicit
   * that proxy must not be relied on for auth. So the check happens here, **and** every page
   * below repeats it for itself (a layout does not re-render on every navigation), **and**
   * every Server Action in `actions.ts` guards independently, because a Server Action is a
   * public POST endpoint no matter what rendered the form.
   */
  const user = await currentUser();

  return (
    <html lang="et" className={`${fontVariables} h-full`}>
      <body
        /*
          White page, not `surface`: the admin's panels are white cards held by 2px borders,
          so a tinted page would leave every one of them floating on a grey field. `surface`
          is reserved here for the things that are deliberately quiet — the dropzone, the
          empty states, the cover-photo row.

          `pb-0` overrides the base layer's body padding, which reserves space for the public
          site's fixed mobile call bar. There is no call bar in the admin, and the 64px it
          would leave lands directly under the sticky action bar.
        */
        className="min-h-full bg-page pb-0 text-fg-strong"
        // §9 hard minimum: 18px base body text, against the public site's fluid 16–17px.
        // Set here rather than as a utility because the type scale has no fixed 18px step —
        // `text-lead` starts at 18px but grows to 22px on a desktop.
        style={{ fontSize: '1.125rem', lineHeight: 1.6 }}
      >
        {user ? (
          <>
            <AdminHeader />
            <main>{children}</main>
          </>
        ) : (
          // Signed out, so the only page that can render here is /admin/login — every other
          // admin page redirects to it before returning any markup. It draws its own full
          // screen, and putting the header, with its "log out" control, above a login form
          // would be nonsense.
          <main>{children}</main>
        )}
      </body>
    </html>
  );
}
