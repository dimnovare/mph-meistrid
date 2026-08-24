import { getLocale, getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/Button';
import { telHref } from '@/content/site';
import { getPathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

import { PhoneIcon } from './Header';

/**
 * The mobile sticky call bar (docs/design-system.md §7.11). Two anchors and zero JavaScript.
 *
 * Always visible — no hide-on-scroll. Hiding it costs the visitor the primary action of the
 * whole site and buys a scroll listener in exchange for nothing.
 *
 * `body` already reserves this bar's height in globals.css, so the footer is never covered
 * and nothing here needs to add padding for it. The safe-area inset is added on top of the
 * 64px so the buttons clear an iPhone's home indicator, which is exactly how the reservation
 * in globals.css is written too.
 */

/**
 * Read by ./MobileNav, which sets `inert` on this element while the full-screen menu covers
 * it — the bar is painted underneath the panel but would otherwise stay tabbable and stay
 * announced. Changing this id means changing it there as well.
 */
const CALL_BAR_ID = 'mph-call-bar';

export async function CallBar() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({ locale, namespace: 'common' });

  const contactHref = `${getPathname({ locale, href: '/' })}#kontakt`;
  const tel = telHref();

  return (
    <div
      id={CALL_BAR_ID}
      className={
        'on-ink fixed inset-x-0 bottom-0 z-30 border-t border-ink-line bg-ink shadow-bar ' +
        'pb-[env(safe-area-inset-bottom)] lg:hidden'
      }
    >
      <div className="flex h-callbar items-center gap-2 px-3 py-2">
        {/*
          The phone is the money action on a trades site, so it takes the filled treatment.
          `telHref()` is null while the number is still `{{PHONE_E164}}` — a dead `tel:` link
          looks tappable and does nothing, so the button points at the contact section
          instead, which is where the number will appear once it is supplied.
        */}
        <Button as="a" href={tel ?? contactHref} className="flex-1">
          <PhoneIcon />
          {t('ctaCall')}
        </Button>

        {/*
          `ghost` plus an explicit border rather than `secondary`: §7.11 asks for a 2px
          `on-ink` outline here, and ghost carries no border utility of its own, so there is
          no 1px/2px collision to resolve at the same specificity.
        */}
        <Button as="a" variant="ghost" href={contactHref} className="flex-1 border-2 border-on-ink">
          {t('ctaQuote')}
        </Button>
      </div>
    </div>
  );
}
