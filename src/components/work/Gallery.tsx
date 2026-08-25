import { getTranslations } from 'next-intl/server';

import { ProjectImage } from '@/components/ui/ProjectImage';
import { buildMediaSrc } from '@/lib/media';
import { t, type Locale, type Project, type ProjectImage as ProjectPhoto } from '@/lib/types';

import { GalleryThumb, Lightbox, type LightboxImage } from './Lightbox';

/**
 * A project's photo grid.
 *
 * This file stays a Server Component and only the button skin and the dialog cross into the
 * client. That split matters more here than anywhere else on the site: the `<img>` elements
 * are the page's actual content, so they are server-rendered with real `src` and real alt
 * text, and a crawler — or a visitor whose JavaScript never arrives — still gets the whole
 * gallery. The client bundle is the interaction, not the pictures.
 *
 * It also has to be this way round: `publicUrl()` reads server-only environment, so the R2
 * URLs can only be resolved here and handed down as plain strings.
 *
 * Layout follows the project-card grid in §7.4 — one column on a phone so amateur photos get
 * maximum size, two from 560px, three from 1024px, uniform 4:3 boxes and a uniform gap. §6.4
 * is blunt that the strict grid and the `shadow-frame` hairline are what make phone photos
 * read as curated rather than collected.
 */
export async function Gallery({ project, locale }: { project: Project; locale: Locale }) {
  const images = orderedImages(project);
  if (images.length === 0) return null;

  const tGallery = await getTranslations({ locale, namespace: 'work.gallery' });
  const name = t(project.title, locale);

  const slides: LightboxImage[] = images.map((image, position) => ({
    id: image.id,
    src: buildMediaSrc(project.id, image),
    width: image.width,
    height: image.height,
    blurDataURL: image.blurDataURL,
    alt: tGallery('imageAlt', { name, index: position + 1 }),
  }));

  return (
    <Lightbox images={slides} title={name}>
      <ul className="grid grid-cols-1 gap-5 xs:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {images.map((image, position) => (
          <li key={image.id}>
            <GalleryThumb index={position} className="group block w-full">
              {/* `relative` + `aspect-cover` is what `fill` needs: a positioned parent with a
                  height resolved before the photo arrives, so nothing shifts (§6.4). The
                  `surface-2` fill is the flat placeholder block the spec asks for — never a
                  shimmer. */}
              <span className="relative block aspect-cover overflow-hidden bg-surface-2">
                <ProjectImage
                  projectId={project.id}
                  image={image}
                  alt={slides[position].alt}
                  fill
                  // Three columns inside `--container-wide` (1440px) minus gutters and gaps
                  // lands each cell near 460px; below that the cell is a half or a full
                  // viewport width.
                  sizes="(min-width: 64rem) 33vw, (min-width: 35rem) 50vw, 100vw"
                  // The first photo is the largest element near the top of this route and so
                  // the LCP candidate (§6.4). `preload`, not the deprecated `priority`.
                  preload={position === 0}
                  // The 1.03 hover scale from §7.4 — the site's single transform, and the
                  // only affordance saying these photos are clickable. Tailwind already wraps
                  // `hover:` in `@media (hover: hover)`, so it never fires on a touch tap.
                  className="transition-transform duration-slow ease-out group-hover:scale-[1.03]"
                />

                {/*
                  §6.4, the single highest-leverage detail in the whole system: a 1px inset
                  hairline inside every photo. Interior shots are mostly white wall, and
                  without the frame a pale photo bleeds into the white page and the grid
                  visually dissolves. It has to be an overlay element rather than a
                  `box-shadow` on the container, because a replaced element paints over its
                  own inset shadow.
                */}
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 shadow-frame" />
              </span>
            </GalleryThumb>
          </li>
        ))}
      </ul>
    </Lightbox>
  );
}

/**
 * Cover photo first, then the rest in the order the administrator arranged them.
 *
 * §6.4: order the grid by quality, not by date — the first row is what a visitor judges the
 * company on, and the cover is the one photo the administrator has already picked out as the
 * best of the set.
 */
function orderedImages(project: Project): ProjectPhoto[] {
  const cover = project.images.find((image) => image.id === project.coverImageId);
  if (!cover) return project.images;
  return [cover, ...project.images.filter((image) => image.id !== cover.id)];
}
