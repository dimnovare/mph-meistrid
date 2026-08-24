'use client';

import { useLocale, useTranslations } from 'next-intl';

import { getPathname, usePathname } from '@/i18n/navigation';
import { locales, type Locale } from '@/i18n/routing';

/**
 * ET / RU switch.
 *
 * The one thing this must get right is that it links to **the same page** in the other
 * language: `usePathname` from `@/i18n/navigation` returns the route with the locale prefix
 * already stripped, so `/ru/tood/vannitoa-remont` comes back as `/tood/vannitoa-remont` and
 * `getPathname` re-prefixes it for the target locale. Reading `window.location` or
 * hard-coding `/` would drop the visitor on the front page every time they switched.
 *
 * Plain `<a>` rather than the `Link` component, and this is deliberate: `Link` with an
 * explicit `locale` prop always forces a prefix (next-intl does that so a locale cookie can
 * be updated), which under `localePrefix: 'as-needed'` produces `/et/…` — a URL that only
 * exists to redirect to `/…`. That would hand crawlers a redirect instead of the canonical
 * URL, for a control whose whole job is pointing at the other language's canonical page.
 * `getPathname` is the same next-intl API without the forced prefix, so the href is exact.
 * A language change is a document-level change anyway; a full load is the honest behaviour.
 *
 * Labels are the ISO 639-1 tags themselves, taken from the routing config — language tags,
 * not copy, so there is nothing here to translate. See the note in the final report about
 * adding real language names to the catalogue if the client wants "Eesti / Русский".
 */

type Props = {
  /** `ink` is the footer's dark band; `light` is the header and the mobile menu. */
  tone?: 'light' | 'ink';
};

// Whole class names, never interpolated fragments: Tailwind finds classes by scanning this
// file as text, so a `after:${bar}` built at runtime would compile to nothing at all.
const toneClasses = {
  light: {
    rest: 'text-fg-muted hover:text-fg-strong',
    current: 'text-fg-strong after:bg-accent',
  },
  ink: {
    rest: 'text-on-ink-muted hover:text-on-ink',
    current: 'text-on-ink after:bg-accent-on-ink',
  },
} as const;

export function LangSwitch({ tone = 'light' }: Props) {
  const t = useTranslations('a11y');
  const active = useLocale() as Locale;
  const pathname = usePathname();
  const styles = toneClasses[tone];

  return (
    // `role="group"` rather than `<nav>`: this is two controls, not a third navigation
    // landmark competing with the header and footer navs in a screen reader's landmark list.
    <div role="group" aria-label={t('langSwitchLabel')} className="flex items-center">
      {locales.map((locale) => {
        const isCurrent = locale === active;

        return (
          <a
            key={locale}
            href={getPathname({ locale, href: pathname })}
            hrefLang={locale}
            lang={locale}
            aria-current={isCurrent ? 'true' : undefined}
            className={
              'relative flex h-tap min-w-tap items-center justify-center text-small ' +
              'font-semibold transition-colors ' +
              // The 2px accent underline is an ::after bar rather than a border so it can sit
              // inside the 44px target without shrinking it or moving the label.
              'after:absolute after:inset-x-2 after:bottom-2.5 after:h-0.5 ' +
              'after:bg-transparent after:transition-colors ' +
              (isCurrent ? styles.current : styles.rest)
            }
          >
            {/* Uppercased in the text, not with `text-transform`: some screen readers spell
                out CSS-uppercased words letter by letter, and "ET" is already the label. */}
            {locale.toUpperCase()}
          </a>
        );
      })}
    </div>
  );
}
