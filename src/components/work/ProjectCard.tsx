import { getTranslations } from 'next-intl/server';

import { ProjectImage } from '@/components/ui/ProjectImage';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { t as localized, type Project } from '@/lib/types';

/**
 * Project card — design-system.md §7.4. The hero of the page.
 *
 * The whole card is one `<a>`, not an image link plus a title link: two adjacent links to
 * the same place is a screen-reader annoyance and halves the touch target.
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
   * back to the gutter on its own (§7.4), and only the grid knows whether it did that.
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
      <div
        // Uniform 4:3 on every card is the single biggest reason a grid of amateur phone
        // photos reads as curated (§6.4). `rounded-none` is stated rather than assumed:
        // photography is never rounded in this system (§5.4).
        className="relative aspect-cover overflow-hidden rounded-none bg-surface-2"
      >
        {cover ? (
          <ProjectImage
            projectId={project.id}
            image={cover}
            alt={title}
            sizes={sizes}
            fill
            // The only transform on the public site (§7.4). Tailwind v4 already emits every
            // `hover` variant inside `@media (hover: hover)`, which is exactly what §7.4
            // asks for — on a touch screen `:hover` sticks after a tap and the image would
            // stay scaled after a back navigation. `:active` is not guarded and does not
            // need to be: it never sticks, and it is the press feedback on a phone.
            className={
              'transition-transform duration-slow ease-out ' +
              'group-hover:scale-[1.03] group-active:scale-[1.01] group-active:duration-fast'
            }
          />
        ) : (
          // Flat `surface-2`, never a shimmer — a skeleton shimmer is a SaaS tell (§6.4).
          <div aria-hidden="true" className="absolute inset-0 bg-surface-2" />
        )}

        {/*
          §6.4, the highest-leverage detail in the system: a 1px inset hairline inside every
          photo, without which a blown-out white wall bleeds into the white page and the grid
          dissolves. It has to be an overlay, not `shadow-frame` on the container — an inset
          box-shadow paints under in-flow children, so the image would cover it.
        */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 shadow-frame" />
      </div>

      <div className={`pt-4 ${captionClassName}`.trim()}>
        {/* 19-20px is off the type scale on purpose (§7.4): the caption has to sit under the
            photo without competing with the section heading. */}
        <h3 className="font-display text-[1.1875rem] font-bold leading-tight text-fg-strong transition-colors group-hover:text-accent-strong lg:text-[1.25rem]">
          {title}
        </h3>
        {location ? <p className="mt-1 text-small text-fg-muted">{location}</p> : null}
      </div>
    </Link>
  );
}
