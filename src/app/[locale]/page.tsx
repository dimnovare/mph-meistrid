import { setRequestLocale } from 'next-intl/server';

import { About } from '@/components/sections/About';
import { Contact } from '@/components/sections/Contact';
import { Hero } from '@/components/sections/Hero';
import { Pricing } from '@/components/sections/Pricing';
import { Services } from '@/components/sections/Services';
import { Work } from '@/components/sections/Work';
import type { Locale } from '@/i18n/routing';

/**
 * The landing page. Header, Footer and the mobile call bar come from `[locale]/layout.tsx`.
 *
 * Section ids are the anchors the header navigates to (`#teenused`, `#tood`, `#hinnad`,
 * `#meist`, `#kontakt`) and `scroll-padding-top` in globals.css keeps each heading clear of
 * the sticky header. They are Estonian in both locales on purpose: an anchor is part of the
 * URL, and one set of ids means one set of links.
 *
 * Tones alternate `surface` / `page` under the ink hero and land on `surface` for the
 * contact section (§5.2, §7.7). The tonal change *is* the section divider — there are no
 * horizontal rules between sections.
 */

/**
 * Both project photos and prices are read from R2 at render time. An hour is short enough
 * that a stale price never lives long, and admin writes call `revalidatePath('/', 'layout')`
 * anyway, so this is only the backstop for an edit made outside the admin.
 */
export const revalidate = 3600;

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Must come before anything reads a message. Without it next-intl falls back to request
  // state, the whole subtree becomes dynamic, and every visit pays an R2 round-trip for
  // content that changes a few times a year.
  setRequestLocale(locale);

  const typed = locale as Locale;

  return (
    <>
      <Hero locale={typed} />
      <Services locale={typed} />
      <Work locale={typed} />
      <Pricing locale={typed} />
      <About locale={typed} />
      <Contact locale={typed} />
    </>
  );
}
