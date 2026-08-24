import { getTranslations } from 'next-intl/server';

import { Logo } from '@/components/brand/Logo';
import { Bricks, FOOTER_BOND } from '@/components/sections/Bricks';
import { FRAME, MONO_LABEL, MONO_META } from '@/components/sections/styles';
import { mailtoHref, site, telHref } from '@/content/site';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

import { NAV_SECTIONS } from './Header';

/**
 * The ink slab that closes the page, standing on two full-width brick courses.
 *
 * The courses are the foundation the whole identity is built on, drawn at page width — the
 * one place the motif is structural rather than a glyph. They sit on the white page above
 * the band, and the band is pulled up 1px so no hairline of page shows through the seam.
 *
 * `.on-ink` flips the focus ring and lets the shared tokens pick their dark-band colours.
 *
 * Nothing that is still a `{{PLACEHOLDER}}` renders as a link. The legal name, the registry
 * code and the phone number are real and are shown; the email is not yet supplied, so its
 * row is absent rather than dead. There is no VAT row at all: the company is not registered
 * for VAT, which is a fact rather than a missing value.
 *
 * No bottom padding for the mobile call bar: `body` already reserves its height in
 * globals.css, and adding it here would reserve it twice.
 */

/** Footer links are quiet until hovered, and every row clears the 44px touch floor. */
const FOOTER_LINK =
  'flex min-h-tap items-center text-small text-on-ink transition-colors duration-fast ' +
  'hover:text-on-ink-muted';

/** Column headings are mono, and sit inside `.on-ink` so they set their own colour. */
const COLUMN_HEADING = `${MONO_LABEL} text-on-ink-muted`;

export async function Footer({ locale }: { locale: Locale }) {
  const [t, tNav, tServices] = await Promise.all([
    getTranslations({ locale, namespace: 'footer' }),
    getTranslations({ locale, namespace: 'nav' }),
    getTranslations({ locale, namespace: 'services' }),
  ]);

  const tel = telHref();
  const mail = mailtoHref();
  const year = new Date().getFullYear();

  return (
    <footer className="on-ink bg-page text-on-ink">
      <Bricks courses={FOOTER_BOND} height={14} joint={3} className="w-full text-ink" />

      <div className="-mt-px bg-ink">
        <div className={`${FRAME} pb-10 pt-16`}>
          <div className="flex flex-wrap items-start justify-between gap-x-10 gap-y-10">
            <div>
              {/* Not a link: the header's logo already goes home, and a second identical
                  destination only adds noise to a screen reader's link list. */}
              <Logo height={30} onInk />
              <p className="mt-4 max-w-[19rem] text-small text-on-ink-muted">{t('tagline')}</p>
            </div>

            <div className="flex flex-wrap gap-x-16 gap-y-8">
              <nav aria-labelledby="footer-nav-heading">
                <h2 id="footer-nav-heading" className={COLUMN_HEADING}>
                  {t('pagesHeading')}
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
                </ul>
              </div>

              <div>
                <h2 className={COLUMN_HEADING}>{t('detailsHeading')}</h2>
                {/* Mono, because these are reference numbers rather than prose — and the
                    registry code is the one identifier a visitor can check the company with,
                    so it is stated in full rather than tucked into a copyright line. */}
                <p className="mt-3 font-mono text-small leading-relaxed text-on-ink-muted">
                  {t('company')}
                  <br />
                  {t('regCode', { code: site.registryCode })}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap justify-between gap-x-5 gap-y-3 border-t border-[rgb(255_255_255_/_0.14)] pt-6">
            <p className={`${MONO_META} text-on-ink-muted`}>{t('copyright', { year })}</p>
            <p className={`${MONO_META} text-on-ink-muted`}>{tServices('strip')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
