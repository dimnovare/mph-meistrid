import { getTranslations } from 'next-intl/server';

import { Logo } from '@/components/brand/Logo';
import { Section } from '@/components/ui/Container';
import type { Locale } from '@/i18n/routing';

import { FRAME } from './styles';

/**
 * The ink band — the page's one full-strength statement, and the only place the stacked
 * lockup appears at size.
 *
 * The lockup is `Logo variant="primary"`, not a picture of one: MEISTRID is a real knockout
 * in that component, so the slab shows the graphite band through the letters exactly as the
 * identity specifies. 121px of total height puts the wordmark at the prototype's 88px —
 * the primary lockup's box is 1.376x its font size (see the ratios in Logo.tsx).
 *
 * Two instances rather than one responsive one because `Logo` sizes itself from a numeric
 * `height` prop written as an inline style, which a responsive class could not override.
 *
 * ── THE 13px NUDGE ──────────────────────────────────────────────────────────
 * Stacked, the lockup is left-aligned above the text, and its *widest* element is the
 * foundation slab, which overhangs the wordmark by 0.146x the font size on each side. Left
 * unshifted, the slab would hang 13px past the 20px content edge and the band would look
 * misaligned against every other section. `ml-[13px]` at the 84px rendition pushes the
 * wordmark right so the slab edge lands flush instead. Above 720px the lockup is its own
 * grid column and the nudge goes away.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * This band replaces the old "Meist" section. It carries no anchor and no nav entry: it is
 * the page's assertion about itself, read on the way past, not a destination.
 */
export async function Band({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'band' });

  return (
    <Section tone="ink" size="sm" labelledBy="band-heading">
      <div className={FRAME}>
        <div className="grid items-center gap-10 min-[45rem]:grid-cols-[auto_1fr] min-[45rem]:gap-20">
          <div>
            <span className="ml-[13px] min-[45rem]:hidden">
              <Logo variant="primary" height={84} onInk />
            </span>
            <span className="hidden min-[45rem]:inline-flex">
              <Logo variant="primary" height={121} onInk />
            </span>
          </div>

          <div className="max-w-copy">
            {/* `.on-ink` flips the focus ring but not the base heading colour, which
                globals.css pins to `fg-strong` — so the inversion is stated here. */}
            <h2 id="band-heading" className="text-h2 text-on-ink">
              {t('heading')}
            </h2>
            <p className="mt-5 text-body text-on-ink-muted">{t('body')}</p>
          </div>
        </div>
      </div>
    </Section>
  );
}
