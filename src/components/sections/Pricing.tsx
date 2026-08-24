import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/Button';
import { Container, Section } from '@/components/ui/Container';
import { isPlaceholder } from '@/content/site';
import type { Locale } from '@/i18n/routing';
import { readPricing } from '@/lib/store';
import { t as localized } from '@/lib/types';

/**
 * Hinnad — design-system.md §7.6.
 *
 * A `<dl>` rendered as a grid, not a `<table>`. A two-column table cannot reflow on a 360px
 * phone without either scrolling sideways or squashing the price into two lines, and a
 * definition list is what this actually is: a term and its value.
 *
 * Prices are free text the client types (`PriceItem.price` is `Localized`, "alates 12 EUR/m2",
 * "kokkuleppel"). They are rendered verbatim and never parsed, formatted or sorted as
 * numbers — the client owns the exact wording, including the currency and the "alates".
 */
export async function Pricing({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'pricing' });
  const { items } = await readPricing();

  const vatNote = t('vatNote');

  return (
    <Section id="hinnad" tone="surface" labelledBy="hinnad-heading">
      {/* The `copy` measure, not `page`: a price list set 1280px wide stops reading like a
          quotation and starts reading like a spreadsheet. */}
      <Container width="copy">
        <span aria-hidden="true" className="mb-5 block h-[3px] w-8 bg-accent" />
        <h2 id="hinnad-heading" className="text-h2">
          {t('heading')}
        </h2>
        <p className="mt-5 text-lead text-fg-muted">{t('intro')}</p>

        {/*
         * Empty state. On day one there are no rows, and there is no message key that says
         * "prices are coming" — inventing one is not allowed. The intro above already says
         * the real price is quoted after a viewing, so the section keeps its heading (the
         * header links to #hinnad and a dead anchor is worse), keeps the disclaimer, and
         * leads with the quote CTA instead of an empty list.
         */}
        {items.length > 0 ? (
          <dl className="mt-block">
            {items.map((item) => {
              const note = item.note ? localized(item.note, locale) : '';

              return (
                <div
                  key={item.id}
                  className={
                    'grid grid-cols-[1fr_auto] items-baseline gap-x-4 border-b border-line ' +
                    // §7.6 specifies `surface` for the row hover, which assumes the section
                    // sits on `page`. This band is the `surface` half of the alternation, so
                    // the hover takes the next step down the ramp instead — same one-step
                    // move, still visible.
                    'py-4 transition-colors last:border-b-0 hover:bg-surface-2 ' +
                    // The dotted leader needs a track of its own from 768px up. `minmax(1rem,1fr)`
                    // guarantees the leader keeps a visible run even when a long service name
                    // takes most of the row.
                    'md:grid-cols-[minmax(0,max-content)_minmax(1rem,1fr)_max-content] md:py-5'
                  }
                >
                  <dt className="min-w-0">
                    <span className="font-sans text-[1.0625rem] font-semibold text-fg-strong">
                      {localized(item.service, locale)}
                    </span>
                    {note ? <span className="mt-1 block text-small text-fg-muted">{note}</span> : null}
                  </dt>

                  {/*
                   * The printed-quotation leader. An empty block element's baseline is its
                   * bottom edge, so `items-baseline` on the row lands the dotted rule exactly
                   * on the text baseline. Suppressed below 768px where there is no room.
                   */}
                  <span
                    aria-hidden="true"
                    className="mx-2 hidden border-b border-dotted border-line-strong md:block"
                  />

                  <dd className="whitespace-nowrap font-display text-[1.1875rem] font-bold tabular-nums text-fg-strong md:text-[1.3125rem]">
                    {localized(item.price, locale)}
                  </dd>
                </div>
              );
            })}
          </dl>
        ) : null}

        {/* Disclaimer: `accent-soft` block with a 3px left accent rule (§7.6). `fg` on
            `accent-soft` is 13.64:1. */}
        <div className="mt-block border-l-[3px] border-accent bg-accent-soft px-5 py-4">
          <p className="text-small text-fg">{t('disclaimer')}</p>
          {/* The VAT line is removed entirely if the company is not VAT-registered, so it is
              still `{{VAT_NOTE_ET}}` here. Printing an unreplaced placeholder next to prices
              would read as a broken price list, and this one is genuinely optional. */}
          {isPlaceholder(vatNote) ? null : (
            <p className="mt-2 text-small text-fg">{vatNote}</p>
          )}
        </div>

        <div className="mt-block">
          <Button as="a" href="#kontakt" variant="secondary">
            {t('cta')}
          </Button>
        </div>
      </Container>
    </Section>
  );
}
