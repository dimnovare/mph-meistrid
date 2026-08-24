import { getTranslations } from 'next-intl/server';

import { QuoteForm } from '@/components/sections/QuoteForm';
import { Section } from '@/components/ui/Container';
import { mailtoHref, site, telHref } from '@/content/site';
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
 * The phone number is real (business register, checked 2026-08-24), so it is a live `tel:`
 * link.
 *
 * The email address is not. `mailtoHref()` returns null while `site.email` is `{{EMAIL}}`,
 * and the whole row is dropped rather than printed: a `mailto:` that opens a compose window
 * addressed to a placeholder is worse than an absent row, because the visitor sends the
 * message and nobody ever reads it.
 *
 * The working hours are deliberately the opposite. `contact.hours` is `{{HOURS}}` on purpose
 * (docs/design/copy-corrections.md §5 — the delivered "E–R 8.00–17.00" was invented) and it
 * renders as that literal marker. It is not a link, so nothing can be sent into a void; a
 * visible marker is a standing reminder that the client still owes us the answer, and it
 * disappears the moment they supply it.
 * ────────────────────────────────────────────────────────────────────────────
 */
export async function Contact({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'contact' });

  const tel = telHref();
  const mailto = mailtoHref();

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
            <div>
              <dt className={`${MONO_LABEL} text-fg-muted`}>{t('phoneLabel')}</dt>
              <dd className="mt-2 font-display text-h3 tabular-nums text-fg-strong">
                {tel ? (
                  <a
                    href={tel}
                    className="inline-flex min-h-tap items-center transition-colors duration-fast hover:text-fg-muted"
                  >
                    {site.phoneDisplay}
                  </a>
                ) : (
                  site.phoneDisplay
                )}
              </dd>
            </div>

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

            <div>
              <dt className={`${MONO_LABEL} text-fg-muted`}>{t('hoursLabel')}</dt>
              <dd className="mt-2 text-small text-fg-muted">{t('hours')}</dd>
            </div>
          </dl>
        </div>
      </div>
    </Section>
  );
}
