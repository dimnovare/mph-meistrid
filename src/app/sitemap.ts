import type { MetadataRoute } from 'next';

import { languageAlternates, urlFor } from '@/lib/seo';
import { publishedProjects } from '@/lib/store';

/**
 * Each entry carries its hreflang alternates so Google sees the ET and RU pages as one
 * document in two languages rather than as duplicates.
 *
 * ── WHY 10 MINUTES AND NOT AN HOUR ──────────────────────────────────────────
 * `revalidatePublic()` in the admin calls `revalidatePath('/sitemap.xml')` after every save,
 * and the landing page does update from its sibling `revalidatePath('/', 'layout')` call —
 * but the sitemap observably does not. Publishing a project left this route serving its
 * deploy-time copy, so the path-based purge does not appear to reach a metadata route.
 *
 * Rather than depend on a mechanism that does not demonstrably work, the window is short
 * enough that staleness cannot matter: crawlers re-read a sitemap on a schedule measured in
 * days, so ten minutes is invisible to them, and the cost is one small R2 read per window
 * and only when something actually requests the file. The `revalidatePath` call stays — it
 * costs nothing and makes this instant if a future Next version starts honouring it.
 * ────────────────────────────────────────────────────────────────────────────
 */
export const revalidate = 600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await publishedProjects();

  const home: MetadataRoute.Sitemap = [
    {
      url: urlFor('et', '/'),
      lastModified: latestChange(projects),
      changeFrequency: 'monthly',
      priority: 1,
      alternates: { languages: languageAlternates('/') },
    },
    {
      url: urlFor('ru', '/'),
      lastModified: latestChange(projects),
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: { languages: languageAlternates('/') },
    },
  ];

  const work = projects.flatMap((project): MetadataRoute.Sitemap => {
    const path = `/tood/${project.slug}`;
    return [
      {
        url: urlFor('et', path),
        lastModified: new Date(project.updatedAt),
        changeFrequency: 'yearly',
        priority: 0.7,
        alternates: { languages: languageAlternates(path) },
      },
      {
        url: urlFor('ru', path),
        lastModified: new Date(project.updatedAt),
        changeFrequency: 'yearly',
        priority: 0.6,
        alternates: { languages: languageAlternates(path) },
      },
    ];
  });

  return [...home, ...work];
}

function latestChange(projects: Array<{ updatedAt: string }>): Date {
  if (projects.length === 0) return new Date();
  return new Date(
    Math.max(...projects.map((p) => new Date(p.updatedAt).getTime())),
  );
}
