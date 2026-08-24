import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { routing } from '@/i18n/routing';

/**
 * Catch-all inside the locale segment. It renders nothing; it exists purely to make a wrong
 * URL land in the right 404.
 *
 * Without this file, a path like `/ru/nothing` matches no route inside `[locale]` at all, so
 * Next never enters the locale segment: `[locale]/layout.tsx` does not run, `[locale]/
 * not-found.tsx` is never reached, and the visitor gets the bare root 404 — no header, no
 * footer, no styling, and Estonian copy on a Russian URL. Matching the path here and then
 * throwing `notFound()` from *inside* `[locale]` puts the visitor in the localised 404 with
 * the full site chrome around it.
 *
 * A static or dynamic segment always wins over a catch-all, so this cannot shadow
 * `/tood/[slug]` or any real page added later.
 */
export default async function CatchAllNotFound({
  params,
}: {
  params: Promise<{ locale: string; rest: string[] }>;
}) {
  const { locale } = await params;

  // Set the locale before throwing, or `not-found.tsx` renders in the default language —
  // which is the whole reason this file exists.
  if (hasLocale(routing.locales, locale)) setRequestLocale(locale);

  notFound();
}
