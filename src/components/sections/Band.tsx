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
 * ── NO NUDGE: THE BOX ALREADY IS THE SLAB ───────────────────────────────────
 * The handoff asks for the lockup to be shifted right by the slab overhang (13px at this
 * size) so the slab lands flush with the content edge. That is correct for the prototype,
 * where the lockup is positioned by its wordmark and the slab hangs outside it — but not
 * here. `Primary` in Logo.tsx sizes its box as `(MPH_ADVANCE + 2 * OVERHANG) * fontSize`
 * and draws the slab at `x={0}` across the full width, so the overhang is *inside* the box
 * and the box's left edge already is the slab's left edge.
 *
 * Applying the shift on top of that pushed the whole lockup 13px right of every other
 * section's text, which is what it looked like on a phone. Left-aligning it normally is
 * what actually lands it flush.
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
            <span className="min-[45rem]:hidden">
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
