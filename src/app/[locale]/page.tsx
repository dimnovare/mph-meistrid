import { setRequestLocale } from 'next-intl/server';

import { Band } from '@/components/sections/Band';
import { Contact } from '@/components/sections/Contact';
import { Hero } from '@/components/sections/Hero';
import { Pricing } from '@/components/sections/Pricing';
import { Process } from '@/components/sections/Process';
import { Services } from '@/components/sections/Services';
import { Work } from '@/components/sections/Work';
import type { Locale } from '@/i18n/routing';

/**
 * The landing page. Header, Footer and the mobile call bar come from `[locale]/layout.tsx`.
 *
 * Section order is the prototype's: Hero, Teenused, the ink Band, Objektid, Protsess,
 * Hinnad, Kontakt. Hinnad is the one section not in the prototype — the signed scope
 * requires a price list and the admin ships an editor for it, so it is built in the same
 * visual language and slotted between the process and the form, where a visitor who has
 * just read how the work happens asks what it costs.
 *
 * Section ids are the anchors the header navigates to (`#teenused`, `#tood`, `#protsess`,
 * `#hinnad`, `#kontakt`) and `scroll-padding-top` in globals.css keeps each heading clear of
 * the sticky header. They are Estonian in both locales on purpose: an anchor is part of the
 * URL, and one set of ids means one set of links.
 *
 * Tones alternate page / ink / page / surface / page: the tonal change *is* the section
 * divider, with a 1px hairline where two light sections meet.
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
    // The safety net the handoff asks for. `clip`, not `hidden`: `overflow: hidden` would
    // make this a scroll container and break `position: sticky` for anything inside it,
    // where `clip` simply refuses to scroll. It catches a single over-long Russian word or a
    // tracked mono strip that a 320px line cannot hold, rather than handing the visitor a
    // horizontally scrolling page.
    <div className="overflow-x-clip">
      <Hero locale={typed} />
      <Services locale={typed} />
      <Band locale={typed} />
      <Work locale={typed} />
      <Process locale={typed} />
      <Pricing locale={typed} />
      <Contact locale={typed} />
    </div>
  );
}
