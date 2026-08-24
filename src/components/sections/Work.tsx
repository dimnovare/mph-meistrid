import { getTranslations } from 'next-intl/server';

import { ProjectCard } from '@/components/work/ProjectCard';
import { Button } from '@/components/ui/Button';
import { Container, Section } from '@/components/ui/Container';
import type { Locale } from '@/i18n/routing';
import { publishedProjects } from '@/lib/store';

/**
 * Tehtud tööd — design-system.md §7.4.
 *
 * `sizes` per breakpoint, measured against the real grid rather than guessed:
 *
 *   <560px    1 column, edge to edge          -> 100vw
 *   560-1023  2 columns, 20px gap             -> 44vw at 1023px, so 45vw
 *   1024-1439 3 columns, 24px gap             -> 29.3vw at 1439px, so 30vw
 *   >=1440    container caps at 1440 - 128px gutters = 1312; (1312-48)/3 -> a fixed 421px
 *
 * Getting this wrong is what makes a photo grid fail Lighthouse: with no `sizes` the browser
 * assumes 100vw and pulls the 2000px variant for a 290px card.
 */
const CARD_SIZES =
  '(min-width: 90rem) 421px, (min-width: 64rem) 30vw, (min-width: 35rem) 45vw, 100vw';

export async function Work({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'work' });
  const projects = await publishedProjects();

  return (
    <Section id="tood" tone="page" labelledBy="tood-heading">
      <Container width="wide">
        <div className="max-w-copy">
          <span aria-hidden="true" className="mb-5 block h-[3px] w-8 bg-accent" />
          <h2 id="tood-heading" className="text-h2">
            {t('heading')}
          </h2>
          {/* The intro promises photos, so it is only honest once there are some. */}
          {projects.length > 0 ? (
            <p className="mt-5 text-lead text-fg-muted">{t('intro')}</p>
          ) : null}
        </div>

        {projects.length === 0 ? (
          /*
           * Day one has zero projects, so this is the state a reviewer sees first — it gets
           * the same care as the populated grid. A bordered block on the alternating tone
           * reads as a deliberate notice rather than as a grid that failed to load, and the
           * CTA keeps the section useful instead of merely apologetic.
           */
          <div className="mt-block max-w-copy rounded-control border border-line bg-surface p-6 lg:p-8">
            <p className="text-body text-fg">{t('empty')}</p>
            <div className="mt-6">
              <Button as="a" href="#kontakt" variant="primary">
                {t('emptyCta')}
              </Button>
            </div>
          </div>
        ) : (
          <ul
            className={
              // Below 560px the negative margin cancels the container gutter so the photos
              // run edge to edge — a phone photo at full viewport width reads as a portfolio
              // plate; the same photo inset by 20px reads as a template. The caption is
              // pushed back to the gutter below.
              'mt-block -mx-gutter grid grid-cols-1 gap-8 ' +
              'xs:mx-0 xs:grid-cols-2 xs:gap-5 lg:grid-cols-3 lg:gap-6'
            }
          >
            {projects.map((project) => (
              <li key={project.id}>
                <ProjectCard
                  project={project}
                  locale={locale}
                  sizes={CARD_SIZES}
                  captionClassName="px-gutter xs:px-0"
                />
              </li>
            ))}
          </ul>
        )}
      </Container>
    </Section>
  );
}
