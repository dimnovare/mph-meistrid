import { publicUrl } from './r2';
import { urlFor } from './seo';
import { SITE_URL } from './env';
import { isPlaceholder, site } from '@/content/site';
import { t, type Locale, type Project } from './types';

/**
 * Structured data.
 *
 * Only facts the client has actually supplied are emitted. A `{{PLACEHOLDER}}` phone number
 * in `telephone` would be worse than no `telephone` at all — Google treats contradicted
 * structured data as a quality signal against the site, and the brief forbids inventing
 * company information.
 */

type JsonLd = Record<string, unknown>;

/**
 * Serialises JSON-LD for embedding in a `<script>` element.
 *
 * `JSON.stringify` alone is not enough. Inside a `<script>` the HTML parser looks for the
 * literal string `</script` before the JavaScript parser sees anything, so a project title
 * of `</script><img onerror=…>` — which the administrator can type — would close the element
 * and inject markup. Escaping `<` as `<` is valid JSON, parses back to the same string,
 * and makes that impossible. `>` and `&` are escaped for the same class of reason.
 */
export function jsonLdScript(data: JsonLd | JsonLd[]): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

/**
 * GeneralContractor is a subtype of LocalBusiness, so one node covers both the
 * "LocalBusiness" and "GeneralContractor" requirements in the brief.
 */
export function businessJsonLd(locale: Locale): JsonLd {
  const node: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'GeneralContractor',
    '@id': `${SITE_URL}/#business`,
    name: site.legalName,
    alternateName: site.shortName,
    url: urlFor(locale, '/'),
    // Estonian registry code. `identifier` is the correct property for a national company
    // number; `vatID` would be wrong, that is a different number.
    identifier: {
      '@type': 'PropertyValue',
      name: 'Registrikood',
      value: site.registryCode,
    },
  };

  if (!isPlaceholder(site.phone)) node.telephone = site.phone;
  if (!isPlaceholder(site.email)) node.email = site.email;
  if (!isPlaceholder(site.region)) {
    node.areaServed = { '@type': 'Place', name: site.region };
    node.address = { '@type': 'PostalAddress', addressCountry: 'EE', addressRegion: site.region };
  } else {
    node.address = { '@type': 'PostalAddress', addressCountry: 'EE' };
  }

  const social = [site.social.facebook, site.social.instagram].filter(Boolean);
  if (social.length > 0) node.sameAs = social;

  return node;
}

export function websiteJsonLd(locale: Locale): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: urlFor(locale, '/'),
    name: site.shortName,
    inLanguage: locale === 'et' ? 'et-EE' : 'ru-RU',
    publisher: { '@id': `${SITE_URL}/#business` },
  };
}

/**
 * A completed job. `CreativeWork` rather than `Product` — these are not for sale, they are
 * examples of work, and marking them as products invites Merchant Center warnings about
 * missing price and availability.
 */
export function projectJsonLd(project: Project, locale: Locale): JsonLd {
  const cover = project.images.find((i) => i.id === project.coverImageId) ?? project.images[0];

  const node: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': `${urlFor(locale, `/tood/${project.slug}`)}#project`,
    name: t(project.title, locale),
    url: urlFor(locale, `/tood/${project.slug}`),
    dateCreated: project.createdAt,
    inLanguage: locale === 'et' ? 'et-EE' : 'ru-RU',
    creator: { '@id': `${SITE_URL}/#business` },
  };

  const description = t(project.description, locale);
  if (description) node.description = description;

  const location = t(project.location, locale);
  if (location) node.contentLocation = { '@type': 'Place', name: location };

  if (cover) {
    node.image = project.images.map((image) =>
      largestVariantUrl(project.id, image.id, image.variants),
    );
  }

  return node;
}

export function breadcrumbJsonLd(
  locale: Locale,
  trail: Array<{ name: string; path: string }>,
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: urlFor(locale, item.path),
    })),
  };
}

function largestVariantUrl(projectId: string, imageId: string, variants: number[]): string {
  const width = variants[variants.length - 1] ?? 1600;
  return publicUrl(`media/projects/${projectId}/${imageId}-${width}.webp`);
}
