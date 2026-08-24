import { getTranslations } from 'next-intl/server';

import { ProjectImage } from '@/components/ui/ProjectImage';
import { Section } from '@/components/ui/Container';
import { site } from '@/content/site';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { publishedProjects } from '@/lib/store';
import { t as localized } from '@/lib/types';

import { Bricks, RUNNING_BOND } from './Bricks';
import { actionClasses, FRAME, MONO_KICKER, MONO_LABEL, UNDERLINE_LINK, UNDERLINE_RULE } from './styles';

/**
 * Hero — the prototype's opening grid: kicker, h1, lead, ink CTA + text link, brick divider
 * on the left; a photograph and its mono caption row on the right. One column below 720px.
 *
 * ── WHERE THE PHOTOGRAPH COMES FROM ─────────────────────────────────────────
 * There is no supplied hero image and there will not be one: a stock photo of somebody
 * else's building site is the first thing a visitor sees and the fastest way to make a real
 * company look fake. So the slot is filled by the company's own most recently added job —
 * which is exactly what the prototype's caption, "VIIMANE OBJEKT", says it is — and the
 * whole plate links through to that job.
 *
 * Newest by `createdAt`, not first in display order: display order is the client's
 * arrangement of the grid below and says nothing about recency, and the caption would then
 * be making a claim the data does not support.
 *
 * On day one there are no projects, so the right column is not rendered at all and the hero
 * is a single column. That is the state a reviewer sees first, and it is why the copy, the
 * CTA pair and the brick divider all sit in the left column rather than straddling both.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * The photo box is width-driven — `aspect-ratio` plus a `max-height` cap, never a fixed
 * height. A fixed height makes the slot derive its width from that height and overflow the
 * column on a narrow screen, which is the specific failure the handoff calls out.
 */

/**
 * The right column is ~1fr of a 1.05fr/1fr grid inside the 1200px frame less the 64px
 * padding and the 64px gap: (1072 − 64) / 2.05 ≈ 492px. Below 720px it is the full width.
 */
const HERO_SIZES = '(min-width: 45rem) 492px, 100vw';

export async function Hero({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'hero' });

  const projects = await publishedProjects();
  const newest = [...projects]
    .filter((project) => project.coverImageId !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const cover = newest?.images.find((image) => image.id === newest.coverImageId) ?? null;

  return (
    <Section tone="page" size="sm" labelledBy="hero-heading">
      <div className={FRAME}>
        <div
          className={
            'grid items-center gap-9 ' +
            (cover ? 'min-[45rem]:grid-cols-[1.05fr_1fr] min-[45rem]:gap-16' : '')
          }
        >
          <div className="flex flex-col items-start">
            {/*
              Three segments, and the third is the registry code — the strongest credential a
              company registered in September 2025 has, and unarguably true where the
              delivered "ALATES 2014" was not. The number is interpolated from
              `site.registryCode` rather than typed into both catalogues, so it lives in one
              place alongside the rest of the verified company facts.

              No `nowrap`, unlike the prototype: "ТАЛЛИНН · ХАРЬЮМАА · РЕГ. 17317439" tracked
              at .22em is about 390px of mono and a 360px phone has 320px of line. It wraps at
              the separators, which is why they are surrounded by ordinary spaces — the break
              lands after HARJUMAA and the code takes its own line, which still reads
              correctly. Shrinking the type to fit is not an option: 13px is the floor.
            */}
            <p className={`${MONO_KICKER} text-fg-muted`}>
              {t('kicker', { code: site.registryCode })}
            </p>

            <h1 id="hero-heading" className="mt-6 max-w-copy text-h1">
              {t('title')}
            </h1>

            <p className="mt-6 max-w-copy text-lead text-fg-muted">{t('subtitle')}</p>

            {/* Wraps rather than overflowing: "Запросить предложение" plus "Смотреть работы"
                is well past a 360px line, and the Russian pair is the reason this row has a
                row-gap at all. */}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <a href="#kontakt" className={actionClasses('ink')}>
                {t('ctaPrimary')}
              </a>
              <a href="#tood" className={UNDERLINE_LINK}>
                <span className={UNDERLINE_RULE}>{t('ctaSecondary')}</span>
              </a>
            </div>

            <Bricks
              courses={RUNNING_BOND}
              height={9}
              joint={2}
              className="mt-10 w-[13.125rem] max-w-full text-ink"
            />
          </div>

          {cover ? (
            <Link href={`/tood/${newest.slug}`} className="group block">
              <div className="relative aspect-wide max-h-[27.5rem] w-full overflow-hidden bg-surface-2">
                <ProjectImage
                  projectId={newest.id}
                  image={cover}
                  alt={localized(newest.title, locale)}
                  sizes={HERO_SIZES}
                  fill
                  // The largest element above the fold, so it is the LCP candidate and the
                  // only image on the page allowed to preload.
                  preload
                  className="transition-transform duration-slow ease-out group-hover:scale-[1.03]"
                />
                {/* The 1px inset hairline every photo on this site carries: without it a
                    blown-out white wall bleeds straight into the white page. */}
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 shadow-frame" />
              </div>

              <div className="mt-3 flex items-baseline justify-between gap-4">
                <span className={`${MONO_LABEL} text-fg-muted`}>{t('photoCaption')}</span>
                {newest.location ? (
                  <span className={`${MONO_LABEL} truncate uppercase text-fg-muted`}>
                    {localized(newest.location, locale)}
                  </span>
                ) : null}
              </div>
            </Link>
          ) : null}
        </div>
      </div>
    </Section>
  );
}
