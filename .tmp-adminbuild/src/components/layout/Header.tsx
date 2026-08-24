import { getTranslations } from 'next-intl/server';

import { Logo } from '@/components/brand/Logo';
import { actionClasses, FRAME } from '@/components/sections/styles';
import { site } from '@/content/site';
import { getPathname, Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

import { LangSwitch } from './LangSwitch';
import { MobileNav } from './MobileNav';

/**
 * Site header: 72px, sticky, 94% white with an 8px blur and a 1px hairline under it.
 *
 * A server component. The only client code in here is the language switcher (which has to
 * read the current pathname) and the mobile menu — the logo, the nav and the CTA are all
 * markup and stay out of the bundle.
 *
 * The height never changes on scroll, and there is no shrink-on-scroll state: a header that
 * reflows on every scroll frame silently breaks `scroll-padding-top`, which is the only
 * thing keeping an anchored section heading out from under the bar. 72px is comfortably
 * inside the 88px `scroll-padding-top` globals.css sets, so an anchor still lands clear.
 *
 * ── THREE TIERS, NOT TWO ────────────────────────────────────────────────────
 * The handoff's mobile layer switches at 720px, and the nav links and hamburger do exactly
 * that. The CTA button does not: it appears at 1024px.
 *
 * The prototype's bar carries four nav links; this one carries five, because Hinnad is a
 * section here and was not in the prototype. Measured at 720px with 32px padding there is
 * 656px of bar: the lockup takes 162, five links about 350, the flags 88. Adding the CTA —
 * "Запросить предложение" is 21 characters — puts the row past 800px and something has to
 * wrap or clip. The handoff itself flags Russian string length as the mobile risk, so the
 * CTA is the thing that waits: it is duplicated in the hero immediately below, in the
 * dropdown panel, and in the sticky call bar on the same viewports.
 * ────────────────────────────────────────────────────────────────────────────
 */

/**
 * The landing page's section anchors, in document order. Exported because the footer repeats
 * the same list and the two drifting apart is exactly the kind of thing nobody notices.
 * `key` indexes the `nav` namespace; `id` is the DOM id the page section carries.
 *
 * `tood` rather than `objektid`, even though the section is now called Objektid: the project
 * pages link back to `#tood` from a file outside this rewrite, and an anchor is part of a
 * URL. The label changed; the address did not.
 */
export const NAV_SECTIONS = [
  { id: 'teenused', key: 'services' },
  { id: 'tood', key: 'works' },
  { id: 'protsess', key: 'process' },
  { id: 'hinnad', key: 'pricing' },
  { id: 'kontakt', key: 'contact' },
] as const;

export async function Header({ locale }: { locale: Locale }) {
  const [t, tA11y] = await Promise.all([
    getTranslations({ locale, namespace: 'nav' }),
    getTranslations({ locale, namespace: 'a11y' }),
  ]);

  const items = NAV_SECTIONS.map((section) => ({
    id: section.id,
    label: t(section.key),
  }));

  // `getPathname` rather than a hand-built prefix: it is the same next-intl routing config
  // the `Link` component uses, so `/` and `/ru` can never disagree with the middleware.
  const contactHref = `${getPathname({ locale, href: '/' })}#kontakt`;

  return (
    // `sticky` is also what makes this the containing block for the mobile dropdown, which
    // positions itself against `top-full`.
    <header className="sticky top-0 z-40 border-b border-line bg-page/94 backdrop-blur-[8px]">
      <div className={`${FRAME} flex h-18 items-center justify-between gap-6`}>
        <Link
          href="/"
          aria-label={site.legalName}
          className="flex min-h-tap items-center text-ink transition-colors duration-fast hover:text-fg-muted"
        >
          {/* Two instances because `Logo` sizes itself from a numeric `height` written as an
              inline style, which a responsive class could not override. */}
          <span className="min-[45rem]:hidden">
            <Logo height={26} />
          </span>
          <span className="hidden min-[45rem]:inline-flex">
            <Logo height={30} />
          </span>
        </Link>

        <div className="flex items-center gap-4 min-[45rem]:gap-5 lg:gap-7">
          <nav
            aria-label={tA11y('mainNav')}
            className="hidden items-center gap-4 min-[45rem]:flex lg:gap-7"
          >
            {items.map((item) => (
              <Link
                key={item.id}
                href={{ pathname: '/', hash: item.id }}
                className="whitespace-nowrap text-small font-semibold text-fg transition-colors duration-fast hover:text-fg-muted"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <LangSwitch />

          {/* The switch is on a wrapper, not on the anchor: `actionClasses` already sets
              `inline-flex`, and Tailwind emits `.inline-flex` after `.hidden`, so a `hidden`
              alongside it would lose the cascade and the button would show at every size. */}
          <span className="hidden lg:block">
            <a href={contactHref} className={actionClasses('ink', 'compact')}>
              {t('ctaQuote')}
            </a>
          </span>

          <MobileNav items={items} contactHref={contactHref} />
        </div>
      </div>
    </header>
  );
}
