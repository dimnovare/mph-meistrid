import { getTranslations } from 'next-intl/server';

import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { isPlaceholder, site, telHref } from '@/content/site';
import { getPathname, Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

import { LangSwitch } from './LangSwitch';
import { HeaderShell, MobileNav } from './MobileNav';

/**
 * Site header. Sticky, and the height never changes on scroll — a shrinking header reflows
 * the page on every scroll frame and silently breaks `scroll-padding-top`, which is the only
 * thing keeping an anchored section heading out from under the bar. The scrolled state is a
 * shadow and nothing else.
 *
 * Three layout tiers, because the obvious two-tier version overflows at exactly 1024px
 * (docs/design-system.md §7.1 — measured, not guessed):
 *
 *   < 1024px    logo 26px · spacer · phone · menu                    8px gaps
 *   1024–1279   logo 32px · nav · ET/RU · phone icon · CTA           20px gaps, ~874/920px
 *   ≥ 1280px    logo 32px · nav · ET/RU · phone + number · CTA       32px gaps, ~1048/1152px
 *
 * One flex row produces all three: the tiers differ only in what is hidden, so there is no
 * duplicated markup to keep in sync and no second header to fall out of date.
 *
 * This is a server component. The only client code in the header lives in ./MobileNav —
 * see the note at the top of that file for why it is one module rather than three.
 */

/**
 * The landing page's section anchors, in document order. Exported because the footer repeats
 * the same list and the two drifting apart is exactly the kind of thing nobody notices.
 * `key` indexes the `nav` namespace; `id` is the DOM id the page section carries.
 */
export const NAV_SECTIONS = [
  { id: 'teenused', key: 'services' },
  { id: 'tood', key: 'works' },
  { id: 'hinnad', key: 'pricing' },
  { id: 'meist', key: 'about' },
  { id: 'kontakt', key: 'contact' },
] as const;

/**
 * 15px per §7.1. `text-small` is the fluid 14→15px step and is 15px from 1280px up, where the
 * nav is at its widest — using it keeps the nav on the type scale instead of smuggling in an
 * off-scale size. `font-semibold` after `text-small` overrides the step's own 400 weight.
 *
 * The state marker is a 3px ::after bar pinned to the bottom of the link. The link is
 * stretched to the full header height, so "bottom of the link" is the header's bottom edge.
 * `aria-[current=true]` is written by the observer in ./MobileNav; without JavaScript the
 * attribute never appears and the nav simply has no highlight.
 */
const NAV_LINK =
  'relative flex items-center whitespace-nowrap text-small font-semibold text-fg ' +
  'transition-colors hover:text-fg-strong aria-[current=true]:text-fg-strong ' +
  'after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-transparent ' +
  'after:transition-colors hover:after:bg-line-strong ' +
  'aria-[current=true]:after:bg-accent aria-[current=true]:hover:after:bg-accent';

export async function Header({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'nav' });

  const items = NAV_SECTIONS.map((section) => ({
    id: section.id,
    label: t(section.key),
  }));

  // `getPathname` rather than a hand-built prefix: it is the same next-intl routing config
  // the `Link` component uses, so `/` and `/ru` can never disagree with the middleware.
  const contactHref = `${getPathname({ locale, href: '/' })}#kontakt`;

  const tel = telHref();
  // The number is still `{{PHONE_DISPLAY}}`. Showing a placeholder in the header would be
  // worse than showing nothing, so the ≥1280px tier falls back to the icon-only control.
  const showNumber = !isPlaceholder(site.phoneDisplay);

  const phoneContent = (
    <>
      <PhoneIcon />
      {/*
        The accessible name, not an `aria-label`. One element serves all three tiers, and at
        ≥1280px the number is visible text — an `aria-label` of "Helista" would then fail
        WCAG 2.5.3 by not containing it. As a hidden prefix the name reads "Helista <number>"
        when the number shows and just "Helista" when it does not.
      */}
      <span className="sr-only">{t('ctaPhone')}</span>
      {showNumber ? (
        <span className="hidden text-small font-semibold tabular-nums xl:inline">
          {site.phoneDisplay}
        </span>
      ) : null}
    </>
  );

  const phoneClasses =
    'inline-flex h-tap min-w-tap items-center justify-center gap-2 rounded-control ' +
    'text-fg-strong transition-colors hover:bg-surface-2 xl:px-3';

  return (
    <HeaderShell>
      <Container className="flex h-full items-center gap-2 lg:gap-5 xl:gap-8">
        {/*
          `mr-auto` is the spacer for every tier: it pins the logo left and lets the rest of
          the row sit against the right gutter without an empty flex child.
          Two Logo instances because §8 fixes 26px below 1024px and 32px above, and the
          component sizes itself with an inline `height` — a responsive class on the logo
          itself would lose to that inline style, so the visibility switch is on a wrapper.
        */}
        <Link
          href="/"
          aria-label={site.legalName}
          className="mr-auto flex items-center rounded-control text-fg-strong"
        >
          <span className="lg:hidden">
            <Logo height={26} />
          </span>
          <span className="hidden lg:block">
            <Logo height={32} />
          </span>
        </Link>

        {/*
          `self-stretch` gives the nav the full header height, and its items stretch inside it
          by default — that is what puts the 3px state bar exactly on the header's bottom edge
          rather than under the text.
        */}
        <nav className="hidden self-stretch lg:flex lg:gap-5 xl:gap-8">
          {items.map((item) => (
            <Link
              key={item.id}
              href={{ pathname: '/', hash: item.id }}
              // Read by the active-section observer, which pairs the link with `#<id>`.
              data-nav-section={item.id}
              className={NAV_LINK}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <LangSwitch />
        </div>

        {/*
          No phone number means no `tel:` href. A dead `tel:` link looks tappable and does
          nothing, which on a trades site is the worst possible failure, so the control
          degrades to a link to the contact section.
        */}
        {tel ? (
          <a href={tel} className={phoneClasses}>
            {phoneContent}
          </a>
        ) : (
          <Link href={{ pathname: '/', hash: 'kontakt' }} className={phoneClasses}>
            {phoneContent}
          </Link>
        )}

        <div className="hidden lg:block">
          <Button as="a" href={contactHref}>
            {t('ctaQuote')}
          </Button>
        </div>

        <MobileNav items={items} contactHref={contactHref} />
      </Container>
    </HeaderShell>
  );
}

/** Inlined rather than pulled from an icon library: one path, `currentColor`, no dependency. */
export function PhoneIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
