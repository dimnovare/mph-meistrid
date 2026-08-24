import type { MetadataRoute } from 'next';

import { languageAlternates, urlFor } from '@/lib/seo';
import { publishedProjects } from '@/lib/store';

/**
 * Regenerated hourly, and immediately after an admin edit via `revalidatePath('/', 'layout')`.
 * Each entry carries its hreflang alternates so Google sees the ET and RU pages as one
 * document in two languages rather than as duplicates.
 */
export const revalidate = 3600;

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
