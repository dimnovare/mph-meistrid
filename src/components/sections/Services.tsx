import { getTranslations } from 'next-intl/server';

import { Section } from '@/components/ui/Container';
import { services } from '@/content/services';
import type { Locale } from '@/i18n/routing';
import { t as localized } from '@/lib/types';

import { FRAME, MONO_LABEL, SECTION_HEAD } from './styles';

/**
 * Teenused — the prototype's spec-sheet grid: a 1.5px ink rule across the top, then flush
 * cells divided only by 1px hairlines, each one a mono index, a name and a line of prose.
 *
 * The cells are flush on purpose (no gap): the grid is meant to read as a drawing's parts
 * list, and a gap between the cells would turn it back into a row of floating cards. The
 * 26px padding is what separates them, which is also why the first cell's text sits inset
 * from the heading above rather than aligned to it.
 *
 * Below 720px the grid drops to one column and the cells drop their side padding, so the
 * text runs flush with the 20px content edge and only the hover fill spans the column. At
 * that width the inset would cost a fifth of the line and buy nothing — there is no
 * neighbouring column left to separate it from.
 *
 * Cards are informational blocks, not links: there is no per-service page to send anyone to,
 * and a block that looks clickable but is not is worse than one that plainly is not.
 *
 * The index is the array position, not stored data — reordering `src/content/services.ts`
 * renumbers the grid and there is nothing to keep in sync.
 */
export async function Services({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'services' });

  return (
    <Section
      id="teenused"
      tone="page"
      size="sm"
      labelledBy="teenused-heading"
      className="border-t border-line"
    >
      <div className={FRAME}>
        <div className={SECTION_HEAD}>
          <h2 id="teenused-heading" className="text-h2">
            {t('heading')}
          </h2>
          <p className={`${MONO_LABEL} text-fg-muted`}>{t('strip')}</p>
        </div>

        <ul className="mt-block grid grid-cols-1 border-t-[1.5px] border-ink min-[45rem]:grid-cols-3">
          {services.map((service, index) => (
            <li
              key={service.id}
              className={
                'flex flex-col gap-3 border-b border-line py-6.5 transition-colors ' +
                'duration-fast hover:bg-surface min-[45rem]:px-6.5 min-[45rem]:pb-7.5'
              }
            >
              <span className={`${MONO_LABEL} text-fg-muted`}>
                {String(index + 1).padStart(2, '0')}
              </span>
              {/* `text-h3` sets size, leading, tracking and weight but deliberately not the
                  family, and this is not a bare h1-h4 default, so state it. */}
              <h3 className="font-display text-h3">{localized(service.name, locale)}</h3>
              <p className="text-small text-fg-muted">
                {localized(service.description, locale)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
