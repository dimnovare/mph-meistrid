import { defineRouting } from 'next-intl/routing';

export const locales = ['et', 'ru'] as const;
export type Locale = (typeof locales)[number];

/** Estonian is the source of truth; a key missing from ru.json renders the Estonian text. */
export const fallbackLocale = 'et' satisfies Locale;

export const routing = defineRouting({
  locales,
  defaultLocale: 'et',

  // Estonian is served from `/`, Russian from `/ru`. The company is Estonian and the
  // domain is .ee, so the apex should be the Estonian page for both users and crawlers.
  localePrefix: 'as-needed',

  // No Accept-Language redirect: `/` is always Estonian, which keeps the most-hit URL
  // deterministic for the CDN and saves crawlers a redirect hop. Visitors switch with the
  // ET/RU control in the header.
  localeDetection: false,

  // With detection off the cookie has nothing to feed, and leaving it out keeps the site
  // cookie-free for visitors — no consent banner needed.
  localeCookie: false,
});
