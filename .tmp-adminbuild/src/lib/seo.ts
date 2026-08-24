import type { Metadata } from 'next';

import { NOINDEX, SITE_URL } from './env';
import { locales, type Locale } from '@/i18n/routing';

/**
 * One place that knows how a URL is built, so canonical, hreflang, sitemap and OG all
 * agree. They disagreeing is the single most common way a small site loses its ranking.
 *
 * Estonian is served from the apex with no prefix, Russian from `/ru`
 * (`localePrefix: 'as-needed'` in src/i18n/routing.ts).
 */

export function pathFor(locale: Locale, path = '/'): string {
  const clean = path === '/' ? '' : `/${path.replace(/^\/+|\/+$/g, '')}`;
  return locale === 'et' ? clean || '/' : `/ru${clean}`;
}

export function urlFor(locale: Locale, path = '/'): string {
  const p = pathFor(locale, path);
  return p === '/' ? `${SITE_URL}/` : `${SITE_URL}${p}`;
}

/** hreflang map for a page that exists in both languages. */
export function languageAlternates(path = '/'): Record<string, string> {
  const map: Record<string, string> = {};
  for (const locale of locales) map[locale] = urlFor(locale, path);
  // x-default points at Estonian: the company is Estonian and the domain is .ee.
  map['x-default'] = urlFor('et', path);
  return map;
}

export function buildMetadata(options: {
  locale: Locale;
  path?: string;
  title: string;
  description: string;
  /** Absolute URL. Falls back to the static /opengraph-image.png. */
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const { locale, path = '/', title, description, image, noIndex } = options;

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical: urlFor(locale, path),
      languages: languageAlternates(path),
    },
    openGraph: {
      type: 'website',
      siteName: 'MPH Meistrid',
      locale: locale === 'et' ? 'et_EE' : 'ru_RU',
      url: urlFor(locale, path),
      title,
      description,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    // A robots.txt disallow stops polite crawlers fetching the page; the meta tag stops a
    // page that was reached some other way (a shared link, an old index entry) from being
    // listed. A demo needs both.
    ...(noIndex || NOINDEX ? { robots: { index: false, follow: false } } : {}),
  };
}
