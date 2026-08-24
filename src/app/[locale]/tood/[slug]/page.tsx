import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { Gallery } from '@/components/work/Gallery';
import { Container, Section } from '@/components/ui/Container';
import { site } from '@/content/site';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { breadcrumbJsonLd, jsonLdScript, projectJsonLd } from '@/lib/jsonld';
import { publicUrl } from '@/lib/r2';
import { buildMetadata } from '@/lib/seo';
import { publishedProjectBySlug, publishedProjects } from '@/lib/store';
import { t, type Project } from '@/lib/types';

/**
 * One completed job.
 *
 * These pages exist because they are nearly free and give Google something concrete to index
 * per job — a real URL, a real `<h1>`, real alt text — which a lightbox on the landing page
 * alone would never provide (docs/design-system.md §7.5).
 */

type Params = { locale: string; slug: string };

/**
 * Hourly, plus an immediate `revalidatePath` after every admin write. The pair with
 * `dynamicParams` below is the point: a project published five minutes after the last deploy
 * is not in `generateStaticParams`, so without `dynamicParams` its URL would 404 until the
 * next build. With it, the first visitor renders the page and it is cached from then on.
 *
 * Both values must stay literal — `revalidate` has to be statically analysable.
 */
export const revalidate = 3600;
export const dynamicParams = true;

/**
 * Only the slug, not the locale.
 *
 * `src/app/[locale]/layout.tsx` already enumerates both locales, and Next runs a child's
 * `generateStaticParams` once per parent combination — so returning `{ slug }` here yields
 * every published project x both locales. Returning the locale as well would generate the
 * cross product twice over.
 */
export async function generateStaticParams() {
  const projects = await publishedProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const path = `/tood/${slug}`;
  const project = await publishedProjectBySlug(slug);

  // An unknown slug still gets metadata, because `generateMetadata` runs before the page
  // throws `notFound()`. Marking it `noindex` stops a crawler that reached a stale or
  // guessed URL from recording it.
  if (!project) {
    const tNotFound = await getTranslations({ locale, namespace: 'common.notFound' });
    return buildMetadata({
      locale,
      path,
      title: tNotFound('title'),
      description: tNotFound('body'),
      noIndex: true,
    });
  }

  const tMeta = await getTranslations({ locale, namespace: 'meta' });

  return buildMetadata({
    locale,
    path,
    // The parent layout's `%s | MPH Meistrid` template wraps this.
    title: t(project.title, locale),
    // A project without its own description falls back to the site description rather than
    // to something assembled from the title — an invented sentence would be duplicated
    // across every undescribed project, which is worse for search than a generic one.
    description: t(project.description, locale) || tMeta('description'),
    // Undefined when the project has no photos yet; `buildMetadata` then omits the image and
    // the site-wide OG image is used.
    image: coverUrl(project),
  });
}

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Must run before anything reads a translation, otherwise next-intl falls back to request
  // state and the whole subtree turns dynamic — which would mean an R2 round-trip per visit
  // on a page whose content changes a few times a year.
  setRequestLocale(locale);

  const project = await publishedProjectBySlug(slug);
  // Covers both an unknown slug and an unpublished one: `publishedProjectBySlug` filters
  // drafts out, so a draft is a 404 to the public exactly like a typo.
  if (!project) notFound();

  const tNav = await getTranslations({ locale, namespace: 'nav' });

  const title = t(project.title, locale);
  const location = t(project.location, locale);
  const description = t(project.description, locale);

  return (
    <Section size="sm">
      <Container width="wide">
        {/*
          Back into the work section of the landing page. `Link` from `@/i18n/navigation`,
          never `next/link` — it is the only one that knows Estonian is served unprefixed and
          Russian from `/ru`.
        */}
        <Link
          href={{ pathname: '/', hash: 'tood' }}
          className="-ml-3 inline-flex h-tap items-center gap-2 rounded-control px-3 font-sans text-body font-semibold text-fg-strong hover:underline hover:decoration-accent hover:decoration-2 hover:underline-offset-4 active:text-accent-strong"
        >
          <ArrowLeftIcon />
          {tNav('works')}
        </Link>

        <header className="mt-6 max-w-copy">
          <h1 className="text-h1">{title}</h1>

          {location ? (
            <p className="mt-4 flex items-center gap-2 text-lead text-fg-muted">
              <PinIcon />
              {location}
            </p>
          ) : null}
        </header>

        {description ? (
          <div className="mt-8 max-w-copy space-y-4 text-body text-fg">
            {/*
              The administrator types this into a plain textarea, so blank lines are the only
              structure it can carry. `whitespace-pre-line` keeps single line breaks inside a
              paragraph rather than collapsing a list of rooms into one run-on sentence.
            */}
            {description
              .split(/\n{2,}/)
              .map((paragraph) => paragraph.trim())
              .filter(Boolean)
              .map((paragraph, index) => (
                <p key={index} className="whitespace-pre-line">
                  {paragraph}
                </p>
              ))}
          </div>
        ) : null}

        {/* A published project with no photos is possible but pointless; render nothing
            rather than an empty framed box. */}
        {project.images.length > 0 ? (
          <div className="mt-block">
            <Gallery project={project} locale={locale} />
          </div>
        ) : null}
      </Container>

      {/*
        The layout emits the business and website nodes on every page; this adds the job
        itself and the trail to it. Serialised through `jsonLdScript`, which escapes `<` so an
        administrator who types `</script>` into a project title cannot close this element and
        inject markup.

        Two crumbs, not three: the work section has no URL of its own — it is an anchor on the
        landing page — and a breadcrumb item pointing at a URL that is already the root would
        be a duplicate rather than a level.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            projectJsonLd(project, locale),
            breadcrumbJsonLd(locale, [
              { name: site.shortName, path: '/' },
              { name: title, path: `/tood/${project.slug}` },
            ]),
          ]),
        }}
      />
    </Section>
  );
}

/**
 * Absolute URL of the cover photo for `openGraph.images`.
 *
 * The width and the `.webp` extension have to be baked in: a social crawler fetches this URL
 * directly and never runs `src/lib/image-loader.ts`. 1200px is the width every platform
 * documents; anything narrower is upscaled and anything wider is wasted bytes, so this takes
 * the first variant at or above it and only falls back to the largest when the source photo
 * was smaller than that.
 */
function coverUrl(project: Project): string | undefined {
  const cover =
    project.images.find((image) => image.id === project.coverImageId) ?? project.images[0];
  if (!cover) return undefined;

  const width = cover.variants.find((value) => value >= 1200) ?? cover.variants.at(-1);
  if (!width) return undefined;

  return publicUrl(`media/projects/${project.id}/${cover.id}-${width}.webp`);
}

/* ------------------------------------------------------------------ icons */

function ArrowLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
    >
      <path d="M8 3L2 9l6 6M2 9h14" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="shrink-0"
    >
      <path d="M9 16.5s5.5-5.1 5.5-9a5.5 5.5 0 1 0-11 0c0 3.9 5.5 9 5.5 9Z" />
      <circle cx="9" cy="7.5" r="2" />
    </svg>
  );
}
