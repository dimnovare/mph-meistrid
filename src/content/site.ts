/**
 * Developer-edited site constants.
 *
 * Everything the client can change themselves (projects, prices) lives in R2 and is edited
 * at /admin. Everything here needs a developer, which is deliberate — it is company
 * identity, not day-to-day content.
 *
 * `{{PLACEHOLDER}}` values must be replaced before launch. `docs/CONTENT.md` is the
 * checklist. `isPlaceholder()` below is what stops an unreplaced value from rendering as a
 * clickable tel: link.
 */

export const site = {
  legalName: 'MPH Meistrid OÜ',
  shortName: 'MPH Meistrid',
  registryCode: '17317439',

  /** E.164, used for the tel: href. */
  phone: '{{PHONE_E164}}',
  /** Human formatting, used for the visible label. */
  phoneDisplay: '{{PHONE_DISPLAY}}',
  email: '{{EMAIL}}',

  /** Service area, shown in the hero and used for LocalBusiness structured data. */
  region: '{{REGION}}',

  /** Optional. Empty strings are not rendered. */
  social: {
    facebook: '',
    instagram: '',
  },

  themeColor: '#1a1d21',
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
