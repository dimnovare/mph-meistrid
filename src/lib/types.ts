/**
 * Content model. Deliberately small.
 *
 * Every visitor-facing string is bilingual. Estonian is required; Russian is optional and
 * falls back to Estonian, which is what lets the administrator add a project in under a
 * minute without filling a second set of fields.
 */
export type Localized = {
  et: string;
  ru?: string;
};

export type ProjectImage = {
  id: string;
  /** Intrinsic size of the largest generated variant, used to reserve space and stop CLS. */
  width: number;
  height: number;
  /** Widths actually generated in R2, ascending. The image loader snaps to these. */
  variants: number[];
  /** Tiny inline base64 WebP shown while the real image loads. */
  blurDataURL: string;
};

export type Project = {
  id: string;
  /** URL segment, e.g. `vannitoa-remont-tallinn`. Unique, derived from the Estonian title. */
  slug: string;
  title: Localized;
  location?: Localized;
  description?: Localized;
  /** Id of the image in `images` used as the card cover. Null only while a draft has no photos. */
  coverImageId: string | null;
  images: ProjectImage[];
  published: boolean;
  /** Ascending. Lower sorts first on the public grid. */
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type PriceItem = {
  id: string;
  service: Localized;
  /** Free text, e.g. "alates 12 €/m²". Kept as text so the client controls the exact wording. */
  price: Localized;
  note?: Localized;
  order: number;
};

export type ProjectsFile = {
  version: 1;
  projects: Project[];
};

export type PricingFile = {
  version: 1;
  items: PriceItem[];
};

export type Locale = 'et' | 'ru';

/** Reads a bilingual field for a locale, falling back to Estonian. */
export function t(value: Localized | undefined, locale: Locale): string {
  if (!value) return '';
  if (locale === 'ru') return value.ru?.trim() || value.et;
  return value.et;
}
