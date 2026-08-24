/**
 * Developer-edited site constants.
 *
 * Everything the client can change themselves (projects, prices) lives in R2 and is edited
 * at /admin. Everything here needs a developer, which is deliberate — it is company
 * identity, not day-to-day content.
 *
 * Values marked "registry" are taken from the Estonian business register entry for
 * 17317439 (inforegister.ee, checked 2026-08-24) and are therefore facts rather than
 * assumptions. `{{PLACEHOLDER}}` values still need the client. `docs/CONTENT.md` is the
 * checklist, and `isPlaceholder()` below is what stops an unreplaced value from rendering
 * as a clickable link.
 */

export const site = {
  /** registry */
  legalName: 'MPH Meistrid OÜ',
  shortName: 'MPH Meistrid',
  /** registry */
  registryCode: '17317439',

  /**
   * registry — the number published in the business register.
   * E.164, used for the tel: href.
   */
  phone: '+37255657983',
  /** Human formatting, used for the visible label. */
  phoneDisplay: '+372 5565 7983',

  /**
   * The register lists info@lemoh.ee, which is a different domain and presumably a different
   * business, so it is not used here. The plan in docs/deployment.md is a Cloudflare Email
   * Routing address on the site's own domain; until that exists this stays a placeholder
   * rather than sending enquiries somewhere they may not be read.
   */
  email: '{{EMAIL}}',

  /**
   * registry — the company's seat is Harju maakond, Tallinn.
   *
   * The street address is deliberately NOT published. The registered address is a flat, so
   * it is the founder's home rather than trade premises, and a mobile finishing service has
   * no reason to invite visitors to it. `areaServed` in the structured data carries the
   * region instead, which is what actually helps local search.
   */
  region: 'Tallinnas ja Harjumaal',
  regionShort: 'Tallinn · Harjumaa',

  /**
   * registry — the company is NOT registered for VAT ("KMKR: puudub"). Prices are therefore
   * shown without a VAT line, and no VAT number is displayed. Revisit if they register.
   */
  vatRegistered: false,

  /** Optional. Empty strings are not rendered. */
  social: {
    facebook: '',
    instagram: '',
  },

  /** Brand graphite. Kept in sync with --color-ink in globals.css. */
  themeColor: '#2B2A26',
} as const;

const PLACEHOLDER = /^\{\{.+\}\}$/;

/** True while a value is still an unreplaced `{{PLACEHOLDER}}`. */
export function isPlaceholder(value: string): boolean {
  return PLACEHOLDER.test(value.trim());
}

/** The tel: href, or null when the number has not been supplied yet. */
export function telHref(): string | null {
  return isPlaceholder(site.phone) ? null : `tel:${site.phone.replace(/[^\d+]/g, '')}`;
}

export function mailtoHref(): string | null {
  return isPlaceholder(site.email) ? null : `mailto:${site.email}`;
}
