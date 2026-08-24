import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The admin is behind a login, but keeping it out of the crawl budget and out of
      // search results costs nothing. Also enforced by an X-Robots-Tag header.
      disallow: ['/admin', '/admin/', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
