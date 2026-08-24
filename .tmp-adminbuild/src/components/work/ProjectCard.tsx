import { getTranslations } from 'next-intl/server';

import { MONO_LABEL } from '@/components/sections/styles';
import { ProjectImage } from '@/components/ui/ProjectImage';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { t as localized, type Project } from '@/lib/types';

/**
 * Project card — a 4:3 plate, a mono meta line and an 800-weight title, in that order.
 *
 * The whole card is one `<a>`, not an image link plus a title link: two adjacent links to
 * the same place is a screen-reader annoyance and halves the touch target.
 *
 * The meta line is the project's own location, uppercased in CSS rather than in the data so
 * the admin keeps typing "Kadriorg, Tallinn" and the sitemap, the JSON-LD and the project
 * page all keep the natural casing. The prototype's meta reads
 * "KADRIORG, TALLINN · 2026 · TÄISRENOVEERIMINE" — the year and the job type are not fields
 * the admin has, and inventing them per card is exactly what the brief forbids, so the line
 * carries the one part that is real and is omitted entirely when even that is empty.
 */
type Props = {
  project: Project;
  locale: Locale;
  /**
   * Owned by the *grid*, not by the card, because the correct value depends entirely on how
   * many columns the surrounding layout has. Required so it can never be forgotten.
   */
  sizes: string;
  /**
   * Also the grid's business: when the image runs edge to edge the caption has to be pushed
   * back to the content edge on its own, and only the grid knows whether it did that.
   */
  captionClassName?: string;
};

export async function ProjectCard({ project, locale, sizes, captionClassName = '' }: Props) {
  const t = await getTranslations({ locale, namespace: 'work.card' });

  const title = localized(project.title, locale);
  const location = project.location ? localized(project.location, locale) : '';

  // `coverImageId` is null while a draft has no photos, and could in principle name an image
  // that has since been deleted. Both resolve to "no cover" rather than to a crash.
  const cover = project.coverImageId
    ? (project.images.find((image) => image.id === project.coverImageId) ?? null)
    : null;

  return (
    <Link
      href={`/tood/${project.slug}`}
      // The visible title is inside the accessible name, so this satisfies WCAG 2.5.3 while
      // still telling a screen-reader user what the card *does*.
      aria-label={t('viewAria', { name: title })}
      className="group block focus-visible:outline-offset-[3px]"
    >
      {/* Uniform 4:3 on every card is the single biggest reason a grid of amateur phone
          photos reads as curated. Square corners: photography is never rounded here. */}
      <div className="relative aspect-cover overflow-hidden rounded-none bg-surface-2">
        {cover ? (
          <ProjectImage
            projectId={project.id}
            image={cover}
            alt={title}
            sizes={sizes}
            fill
            // The only transform on the public site. Tailwind v4 already emits every `hover`
            // variant inside `@media (hover: hover)`, which is what keeps a tapped card from
            // staying scaled after a back navigation. `:active` is not guarded and does not
            // need to be: it never sticks, and it is the press feedback on a phone.
            className={
              'transition-transform duration-slow ease-out ' +
              'group-hover:scale-[1.03] group-active:scale-[1.01] group-active:duration-fast'
            }
          />
        ) : (
          // Flat `surface-2`, never a shimmer — a skeleton shimmer is a SaaS tell.
          <div aria-hidden="true" className="absolute inset-0 bg-surface-2" />
        )}

        {/*
          The highest-leverage detail in the system: a 1px inset hairline inside every photo,
          without which a blown-out white wall bleeds into the white page and the grid
          dissolves. It has to be an overlay, not `shadow-frame` on the container — an inset
          box-shadow paints under in-flow children, so the image would cover it.
        */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 shadow-frame" />
      </div>

      <div className={`flex flex-col gap-2 pt-3.5 ${captionClassName}`.trim()}>
        {location ? (
          <span className={`${MONO_LABEL} uppercase text-fg-muted`}>{location}</span>
        ) : null}
        <h3 className="font-display text-h3 text-fg-strong transition-colors duration-fast group-hover:text-fg-muted">
          {title}
        </h3>
      </div>
    </Link>
  );
}
