import { getTranslations } from 'next-intl/server';

import { Logo } from '@/components/brand/Logo';
import { Container } from '@/components/ui/Container';
import { mailtoHref, site, telHref } from '@/content/site';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

import { NAV_SECTIONS } from './Header';
import { LangSwitch } from './LangSwitch';

/**
 * The ink slab that closes the page (docs/design-system.md §7.8). `.on-ink` flips the focus
 * ring and lets the shared primitives pick their dark-band colours; the band itself is the
 * page's foundation, so it carries the company's legal identity and nothing decorative.
 *
 * Nothing that is still a `{{PLACEHOLDER}}` renders as a link. The legal name and the
 * registry code are real and are shown; the phone, the email and the VAT number are not yet
 * supplied, and a link that looks live but is not is worse than an absent row.
 *
 * No bottom padding for the mobile call bar: `body` already reserves its height in
 * globals.css, and adding it here would reserve it twice.
 */

/** Footer links are quiet until hovered, and every row clears the 44px touch floor. */
const FOOTER_LINK =
  'flex min-h-tap items-center text-on-ink-muted transition-colors hover:text-on-ink';

/** Column headings sit inside `.on-ink`, so they have to override the base heading colour. */
const COLUMN_HEADING = 'text-label uppercase text-on-ink';

/**
 * Catches a marker anywhere inside a translated sentence, which `isPlaceholder` cannot do —
 * it tests whole values. Used only for the VAT line, which docs/CONTENT.md says is removed
 * outright when the company is not VAT-registered; an unanswered marker is indistinguishable
 * from that answer, so both cases hide the line.
 */
const MARKER = /\{\{.+?\}\}/;

export async function Footer({ locale }: { locale: Locale }) {
  const [t, tNav, tCommon] = await Promise.all([
    getTranslations({ locale, namespace: 'footer' }),
    getTranslations({ locale, namespace: 'nav' }),
    getTranslations({ locale, namespace: 'common' }),
  ]);

  const tel = telHref();
  const mail = mailtoHref();
  const vat = t('vat');
  const year = new Date().getFullYear();

  return (
    <footer className="on-ink bg-ink text-on-ink">
      <Container>
        {/* Stacked with 32px between groups on mobile; three columns from 1024px. */}
        <div className="grid gap-8 pb-8 pt-14 lg:grid-cols-3 lg:gap-10 lg:pb-10 lg:pt-20">
          <div>
            {/* Not a link: the header's logo already goes home, and a second identical
                destination only adds noise to a screen reader's link list. */}
            <Logo height={28} onInk />
            <p className="mt-4 max-w-copy text-small text-on-ink-muted">{t('tagline')}</p>
          </div>

          <nav aria-labelledby="footer-nav-heading">
            <h2 id="footer-nav-heading" className={COLUMN_HEADING}>
              {t('navHeading')}
            </h2>
            <ul className="mt-2">
              {NAV_SECTIONS.map((section) => (
                <li key={section.id}>
                  <Link href={{ pathname: '/', hash: section.id }} className={FOOTER_LINK}>
                    {tNav(section.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className={COLUMN_HEADING}>{t('contactHeading')}</h2>
            <ul className="mt-2">
              {tel ? (
                <li>
                  <a href={tel} className={`${FOOTER_LINK} tabular-nums`}>
                    {site.phoneDisplay}
                  </a>
                </li>
              ) : null}
              {mail ? (
                <li>
                  {/* Long addresses overflow a 360px column without an explicit break. */}
                  <a href={mail} className={`${FOOTER_LINK} [overflow-wrap:anywhere]`}>
                    {site.email}
                  </a>
                </li>
              ) : null}
              <li>
                <Link href={{ pathname: '/', hash: 'kontakt' }} className={FOOTER_LINK}>
                  {tCommon('ctaQuote')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </Container>

      {/* Bottom bar: the rule spans the full width, the content stays inside the gutter. */}
      <div className="border-t border-ink-line">
        <Container>
          <div className="flex flex-col gap-4 py-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="text-small text-on-ink-muted">
              <p className="max-w-copy">{t('privacy')}</p>
              <p className="mt-3">
                {/* Registry code 17317439 is real and public — it is the one identifier a
                    visitor can check the company with, so it is stated in full. */}
                {t('company')} · {t('regCode')}
                {MARKER.test(vat) ? null : <> · {vat}</>} · © {year}
              </p>
            </div>

            <LangSwitch tone="ink" />
          </div>
        </Container>
      </div>
    </footer>
  );
}
