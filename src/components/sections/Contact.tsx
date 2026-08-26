import { getTranslations } from 'next-intl/server';

import { QuoteForm } from '@/components/sections/QuoteForm';
import { Section } from '@/components/ui/Container';
import { isPlaceholder, mailtoHref, site, telHref } from '@/content/site';
import type { Locale } from '@/i18n/routing';

import { FRAME, MONO_LABEL } from './styles';

/**
 * Kontakt — the form on the left, the details rail on the right behind a 1px rule.
 *
 * The section heading is "Küsi pakkumist", not "Kontakt": that is what the prototype puts
 * here and it is the honest label for a block whose only working control is a form. The nav
 * entry stays "Kontakt" because that is what a visitor scans a menu for.
 *
 * Below 720px the two halves stack, form first, and the rail swaps its left rule for a top
 * one — the divider has to move with the axis or it stops dividing anything.
 *
 * ── WHAT DEGRADES, AND HOW ──────────────────────────────────────────────────
 * Every row here is dropped when its value has not been supplied, rather than printed with
 * a `{{MARKER}}` in it. A marker on a live page reads as a broken site to a visitor, and it
 * is the developer's reminder, not theirs — `docs/CONTENT.md` is where it is tracked.
 *
 * That applies to all three variable rows: the phone (currently withheld at the client's
 * request), the email (`{{EMAIL}}` until the Cloudflare routing address exists) and the
 * working hours (`{{HOURS}}` — the delivered "E–R 8.00–17.00" was invented, see
 * docs/design/copy-corrections.md §5).
 *
 * The linked ones matter most: a `mailto:` pointing at a placeholder opens a compose window,
 * the visitor sends their enquiry, and nobody ever reads it. An absent row loses nothing,
 * because the quote form beside it is the working path either way.
 * ────────────────────────────────────────────────────────────────────────────
 */
export async function Contact({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'contact' });

  const tel = telHref();
  const mailto = mailtoHref();
  const hours = t('hours');

  return (
    <Section
      id="kontakt"
      tone="page"
      size="sm"
      labelledBy="kontakt-heading"
      className="border-t border-line"
    >
      <div className={FRAME}>
        <div className="grid items-start gap-11 min-[45rem]:grid-cols-[1.15fr_1fr] min-[45rem]:gap-18">
          <div>
            <h2 id="kontakt-heading" className="text-h2">
              {t('heading')}
            </h2>
            <p className="mt-4 max-w-copy text-body text-fg-muted">{t('intro')}</p>

            <div className="mt-8 max-w-form">
              <QuoteForm />
            </div>
          </div>

          <dl
            className={
              'flex flex-col gap-7 border-t border-line pt-7 ' +
              'min-[45rem]:border-l min-[45rem]:border-t-0 min-[45rem]:pl-12 min-[45rem]:pt-0'
            }
          >
            {tel ? (
              <div>
                <dt className={`${MONO_LABEL} text-fg-muted`}>{t('phoneLabel')}</dt>
                <dd className="mt-2 font-display text-h3 tabular-nums text-fg-strong">
                  <a
                    href={tel}
                    className="inline-flex min-h-tap items-center transition-colors duration-fast hover:text-fg-muted"
                  >
                    {site.phoneDisplay}
                  </a>
                </dd>
              </div>
            ) : null}

            {mailto ? (
              <div>
                <dt className={`${MONO_LABEL} text-fg-muted`}>{t('emailLabel')}</dt>
                <dd className="mt-2 font-display text-h3 text-fg-strong">
                  <a
                    href={mailto}
                    className="inline-flex min-h-tap items-center [overflow-wrap:anywhere] transition-colors duration-fast hover:text-fg-muted"
                  >
                    {site.email}
                  </a>
                </dd>
              </div>
            ) : null}

            <div>
              <dt className={`${MONO_LABEL} text-fg-muted`}>{t('regionLabel')}</dt>
              <dd className="mt-2 text-small text-fg-muted">{t('region')}</dd>
            </div>

            {isPlaceholder(hours) ? null : (
              <div>
                <dt className={`${MONO_LABEL} text-fg-muted`}>{t('hoursLabel')}</dt>
                <dd className="mt-2 text-small text-fg-muted">{hours}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </Section>
  );
}
