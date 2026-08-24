import { getTranslations } from 'next-intl/server';

import { Section } from '@/components/ui/Container';
import type { Locale } from '@/i18n/routing';

import { Bricks, GLYPH_TWO } from './Bricks';
import { FRAME, MONO_LABEL } from './styles';

/**
 * Protsess — four steps on the surface band, each under its own 1.5px ink rule. Four columns
 * from 720px up, one below it.
 *
 * An `<ol>`, not a `<ul>`: the four steps happen in order, and a screen reader announcing
 * "list item 3 of 4" is carrying real information here rather than decoration. The visible
 * mono index is the array position, so the numbering cannot drift from the markup.
 *
 * Step ids rather than an array in the catalogue: `check-messages` walks leaf keys, so
 * `steps.handover.name` is checked in both languages the same way every other string is,
 * where a JSON array would flatten to `steps.3.name` and read as noise in a diff. The order
 * lives here, in code, next to the layout that renders it.
 *
 * The fourth step is the one docs/design/copy-corrections.md rewrote: the delivered
 * "Üleandmine ja garantii" promised a warranty, which under VÕS is a contract term the
 * company would be held to rather than a slogan.
 */
const STEPS = ['meeting', 'quote', 'build', 'handover'] as const;

export async function Process({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'process' });

  return (
    <Section
      id="protsess"
      tone="surface"
      size="sm"
      labelledBy="protsess-heading"
      className="border-t border-line"
    >
      <div className={FRAME}>
        <h2 id="protsess-heading" className="text-h2">
          {t('heading')}
        </h2>

        <ol className="mt-block grid grid-cols-1 gap-6.5 min-[45rem]:grid-cols-4 min-[45rem]:gap-9">
          {STEPS.map((step, index) => (
            <li
              key={step}
              className="flex flex-col items-start gap-3.5 border-t-[1.5px] border-ink pt-4"
            >
              <Bricks courses={GLYPH_TWO} height={16} joint={2} className="w-6.5 text-ink" />
              <span className={`${MONO_LABEL} text-fg-muted`}>
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="font-display text-h3">{t(`steps.${step}.name`)}</h3>
              <p className="text-small text-fg-muted">{t(`steps.${step}.desc`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
