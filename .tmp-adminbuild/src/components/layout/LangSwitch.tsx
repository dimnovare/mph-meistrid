'use client';

import { useLocale, useTranslations } from 'next-intl';

import { getPathname, usePathname } from '@/i18n/navigation';
import { locales, type Locale } from '@/i18n/routing';

/**
 * ET / RU switch — two flag chips, each built from three stacked stripes.
 *
 * No emoji and no images, per the handoff. A flag emoji renders as the two-letter code on
 * Windows, which is the platform most of this site's Estonian visitors are on, and an image
 * would be two more requests for twelve pixels of colour.
 *
 * The one thing this must get right is that it links to **the same page** in the other
 * language: `usePathname` from `@/i18n/navigation` returns the route with the locale prefix
 * already stripped, so `/ru/tood/vannitoa-remont` comes back as `/tood/vannitoa-remont` and
 * `getPathname` re-prefixes it for the target locale. Reading `window.location` or
 * hard-coding `/` would drop the visitor on the front page every time they switched. That is
 * also the only reason this component is on the client at all.
 *
 * Plain `<a>` rather than the `Link` component, and this is deliberate: `Link` with an
 * explicit `locale` prop always forces a prefix (next-intl does that so a locale cookie can
 * be updated), which under `localePrefix: 'as-needed'` produces `/et/…` — a URL that only
 * exists to redirect to `/…`. That would hand crawlers a redirect instead of the canonical
 * URL, for a control whose whole job is pointing at the other language's canonical page.
 * `getPathname` is the same next-intl API without the forced prefix, so the href is exact.
 * A language change is a document-level change anyway; a full load is the honest behaviour.
 */

/**
 * The three stripes of each flag, top to bottom. Estonian blue/black/white and Russian
 * white/blue/red are civic constants rather than brand colours, so they are literals here
 * and not tokens — there is no palette decision to make and nothing to keep in sync.
 */
const STRIPES: Record<Locale, readonly [string, string, string]> = {
  et: ['#0072CE', '#161616', '#ffffff'],
  ru: ['#ffffff', '#0039A6', '#D52B1E'],
};

/**
 * Each flag is labelled in its own language — "Eesti keeles", "По-русски" — so the label
 * reads correctly whichever page it is on. They come from the catalogue rather than being
 * hard-coded, but both files carry the same pair for exactly that reason.
 */
const LABEL_KEY: Record<Locale, 'langEt' | 'langRu'> = { et: 'langEt', ru: 'langRu' };

export function LangSwitch() {
  const t = useTranslations('a11y');
  const active = useLocale() as Locale;
  const pathname = usePathname();

  return (
    // `role="group"` rather than `<nav>`: this is two controls, not a third navigation
    // landmark competing with the header and footer navs in a screen reader's landmark list.
    <div role="group" aria-label={t('langSwitchLabel')} className="flex items-center">
      {locales.map((locale) => {
        const isCurrent = locale === active;
        const [top, middle, bottom] = STRIPES[locale];

        return (
          <a
            key={locale}
            href={getPathname({ locale, href: pathname })}
            hrefLang={locale}
            lang={locale}
            aria-label={t(LABEL_KEY[locale])}
            aria-current={isCurrent ? 'true' : undefined}
            // The padding is what makes the 44px target — never the chip, which stays 24x17
            // so the stripes keep their proportions.
            className="group flex size-tap items-center justify-center"
          >
            {/* Border and 2px inset sit outside the chip, so the stripes keep their exact
                24x17 and the active/inactive border does not eat into them. */}
            <span
              className={
                'flex border-2 p-0.5 transition duration-fast ' +
                (isCurrent
                  ? 'border-ink'
                  : 'border-line opacity-55 grayscale-[55%] group-hover:opacity-100 group-hover:grayscale-0')
              }
            >
              {/* An inset keyline, so the white stripe of either flag still has an edge
                  against the white header. */}
              <span
                aria-hidden="true"
                className="flex h-[17px] w-6 flex-col shadow-[inset_0_0_0_1px_rgb(27_29_31_/_0.12)]"
              >
                <span className="flex-1" style={{ background: top }} />
                <span className="flex-1" style={{ background: middle }} />
                <span className="flex-1" style={{ background: bottom }} />
              </span>
            </span>
          </a>
        );
      })}
    </div>
  );
}
