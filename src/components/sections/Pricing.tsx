import { getTranslations } from 'next-intl/server';

import { Section } from '@/components/ui/Container';
import type { Locale } from '@/i18n/routing';
import { readPricing } from '@/lib/store';
import { t as localized } from '@/lib/types';

import { Bricks, GLYPH_THREE } from './Bricks';
import { actionClasses, FRAME, INK_PANEL, MONO_LABEL } from './styles';

/**
 * Hinnad.
 *
 * ── WHY THIS SECTION EXISTS AT ALL ──────────────────────────────────────────
 * It is not in the prototype. The signed scope requires a price list, and the admin ships a
 * full price editor behind "Muuda hindu"; without this section the client would be editing
 * numbers that appear nowhere on their own site. So it is built in the prototype's language
 * rather than borrowed from the old design:
 *
 *   - the 1.5px ink top rule and the 1px hairline rows are Teenused' spec-sheet grid, turned
 *     from three columns into one so a term and its price sit on the same line;
 *   - the mono index down the left is the same device as the service cells and the process
 *     steps, so the numbering reads as one system across the page;
 *   - `surface` on row hover is Teenused' hover fill, and the rows drop their side padding
 *     below 720px exactly as the service cells do;
 *   - the disclaimer sits in the bordered panel with the brick glyph — the prototype's one
 *     notice treatment, which also carries the quote confirmation and the empty project
 *     grid. That panel is what replaces the retired `accent-soft` tint block.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * A `<dl>`, not a `<table>`. A two-column table cannot reflow on a 360px phone without
 * either scrolling sideways or breaking the price across two lines, and a definition list is
 * what this actually is: a term and its value. The mono index lives inside the `<dt>`
 * because a `<dl>` row group may only contain `<dt>` and `<dd>`.
 *
 * Prices are free text the client types (`PriceItem.price` is `Localized` — "alates 12 €/m²",
 * "kokkuleppel"). They are rendered verbatim and never parsed, formatted or sorted as
 * numbers: the client owns the exact wording, including the currency and the "alates".
 *
 * No VAT line anywhere. The company is not registered for VAT (business register, checked
 * 2026-08-24), so there is no rate to state and `site.vatRegistered` is `false`.
 *
 * Empty state: on day one there are no rows and there is no catalogue string that says
 * "prices are coming" — inventing one is not allowed. The intro already says the real price
 * follows a viewing, so the section keeps its heading (the header links to `#hinnad` and a
 * dead anchor is worse than a short section), keeps the disclaimer panel, and leads with the
 * quote CTA instead of an empty list.
 */
export async function Pricing({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'pricing' });
  const { items } = await readPricing();

  return (
    <Section
      id="hinnad"
      tone="page"
      size="sm"
      labelledBy="hinnad-heading"
      className="border-t border-line"
    >
      <div className={FRAME}>
        <h2 id="hinnad-heading" className="text-h2">
          {t('heading')}
        </h2>
        <p className="mt-5 max-w-copy text-body text-fg-muted">{t('intro')}</p>

        {items.length > 0 ? (
          <dl className="mt-block border-t-[1.5px] border-ink">
            {items.map((item, index) => {
              const note = item.note ? localized(item.note, locale) : '';

              return (
                <div
                  key={item.id}
                  className={
                    'grid grid-cols-[1fr_auto] items-baseline gap-x-5 border-b border-line ' +
                    'py-5 transition-colors duration-fast hover:bg-surface min-[45rem]:p-6.5'
                  }
                >
                  <dt className="flex min-w-0 items-baseline gap-4">
                    <span className={`${MONO_LABEL} shrink-0 text-fg-muted`}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0">
                      <span className="font-display text-h3">
                        {localized(item.service, locale)}
                      </span>
                      {note ? (
                        <span className="mt-1 block text-small text-fg-muted">{note}</span>
                      ) : null}
                    </span>
                  </dt>

                  <dd className="whitespace-nowrap font-display text-h3 tabular-nums text-fg-strong">
                    {localized(item.price, locale)}
                  </dd>
                </div>
              );
            })}
          </dl>
        ) : null}

        <div className={`${INK_PANEL} mt-block max-w-copy`}>
          <Bricks courses={GLYPH_THREE} height={20} joint={2} className="w-[2.125rem] text-ink" />
          <p className="text-small text-fg">{t('disclaimer')}</p>
          <a href="#kontakt" className={actionClasses('ink')}>
            {t('cta')}
          </a>
        </div>
      </div>
    </Section>
  );
}
