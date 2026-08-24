import { getTranslations } from 'next-intl/server';

import { ProjectCard } from '@/components/work/ProjectCard';
import { Section } from '@/components/ui/Container';
import type { Locale } from '@/i18n/routing';
import { publishedProjects } from '@/lib/store';

import { Bricks, GLYPH_THREE } from './Bricks';
import { actionClasses, FRAME, INK_PANEL, MONO_LABEL, SECTION_HEAD } from './styles';

/**
 * Objektid — the prototype's 2-up plate grid, and the section that replaces "Tehtud tööd".
 *
 * The four projects in the prototype are filler and never reach production: everything here
 * comes from `publishedProjects()`, which is what the client actually entered at /admin.
 * Presenting invented work as completed jobs is the one thing the brief forbids outright.
 *
 * Which means the empty state is the important state. On day one there are no projects and
 * this is the first thing anyone sees, so it gets the panel treatment the rest of the page
 * uses for a notice — a 1.5px ink rule and a brick glyph — rather than a blank grid that
 * looks like a failed fetch. The mono strip ("VALIK TEHTUD TÖID") is suppressed alongside
 * it: a selection of nothing is not a selection.
 *
 * `sizes`, measured against the real grid rather than guessed. Getting it wrong is what
 * makes a photo grid fail Lighthouse — with no `sizes` the browser assumes 100vw and pulls
 * the 2000px variant for a 300px card.
 *
 *   <720px    1 column, edge to edge                          -> 100vw
 *   720-1199  2 columns, 40px gap                             -> 48vw
 *   >=1200    frame caps at 1200 - 64px padding = 1136;
 *             (1136 - 40) / 2                                 -> a fixed 548px
 */
const CARD_SIZES = '(min-width: 75rem) 548px, (min-width: 45rem) 48vw, 100vw';

export async function Work({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'work' });
  const projects = await publishedProjects();

  return (
    <Section id="tood" tone="page" size="sm" labelledBy="tood-heading">
      <div className={FRAME}>
        <div className={SECTION_HEAD}>
          <h2 id="tood-heading" className="text-h2">
            {t('heading')}
          </h2>
          {projects.length > 0 ? (
            <p className={`${MONO_LABEL} text-fg-muted`}>{t('strip')}</p>
          ) : null}
        </div>

        {projects.length === 0 ? (
          <div className={`${INK_PANEL} mt-block max-w-copy`}>
            <Bricks courses={GLYPH_THREE} height={20} joint={2} className="w-[2.125rem] text-ink" />
            <p className="text-body text-fg">{t('empty')}</p>
            <a href="#kontakt" className={actionClasses('ink')}>
              {t('emptyCta')}
            </a>
          </div>
        ) : (
          <ul
            className={
              // Below 720px the negative margin cancels the frame's 20px padding so the
              // photos run edge to edge — a phone photo at full viewport width reads as a
              // portfolio plate; the same photo inset by 20px reads as a template. The
              // caption is pushed back to the edge by `captionClassName`.
              'mt-block -mx-5 grid grid-cols-1 gap-y-9 ' +
              'min-[45rem]:mx-0 min-[45rem]:grid-cols-2 min-[45rem]:gap-x-10 min-[45rem]:gap-y-11'
            }
          >
            {projects.map((project) => (
              <li key={project.id}>
                <ProjectCard
                  project={project}
                  locale={locale}
                  sizes={CARD_SIZES}
                  captionClassName="px-5 min-[45rem]:px-0"
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}
