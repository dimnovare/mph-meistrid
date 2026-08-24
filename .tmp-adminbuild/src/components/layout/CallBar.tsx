import { getLocale, getTranslations } from 'next-intl/server';

import { actionClasses } from '@/components/sections/styles';
import { telHref } from '@/content/site';
import { getPathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

/**
 * The mobile sticky call bar. Two anchors and zero JavaScript.
 *
 * Not in the prototype, which has no mobile call bar — but `body` in globals.css reserves
 * this bar's height below 1024px, the phone number is now real, and on a trades site the
 * call is the money action. Removing it would leave a 64px hole at the foot of every mobile
 * page and take the primary action with it, so it stays and is restyled into the 5a
 * language: an ink band, a white fill for the call, a white outline for the quote.
 *
 * Always visible — no hide-on-scroll. Hiding it costs the visitor the primary action of the
 * whole site and buys a scroll listener in exchange for nothing.
 *
 * `body` already reserves the height, so nothing here needs to add padding for it. The
 * safe-area inset is added on top of the 64px so the buttons clear an iPhone's home
 * indicator, which is exactly how the reservation in globals.css is written too.
 */
export async function CallBar() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({ locale, namespace: 'common' });

  const contactHref = `${getPathname({ locale, href: '/' })}#kontakt`;
  const tel = telHref();

  return (
    <div
      className={
        'on-ink fixed inset-x-0 bottom-0 z-30 border-t border-ink-line bg-ink shadow-bar ' +
        'pb-[env(safe-area-inset-bottom)] lg:hidden'
      }
    >
      <div className="flex min-h-callbar items-center gap-2 px-3 py-2">
        {/*
          `telHref()` is null while the number is still a placeholder — a dead `tel:` link
          looks tappable and does nothing, so the button would point at the contact section
          instead. The number is real now, so this is the live path.
        */}
        {/* `min-w-0` and the `bar` size are what let two labels share a 360px bar: a flex
            item will not shrink below its own content width without the former, and the
            Russian pair is 30 characters. */}
        <a href={tel ?? contactHref} className={`${actionClasses('onInk', 'bar')} min-w-0 flex-1`}>
          <PhoneIcon />
          {t('ctaCall')}
        </a>

        <a href={contactHref} className={`${actionClasses('onInkOutline', 'bar')} min-w-0 flex-1`}>
          {t('ctaQuote')}
        </a>
      </div>
    </div>
  );
}

/** Inlined rather than pulled from an icon library: one path, `currentColor`, no dependency. */
function PhoneIcon() {
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
