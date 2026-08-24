/**
 * The admin's visual vocabulary, as class strings.
 *
 * A plain module with no `'use client'` on purpose. Class strings exported from a client
 * module arrive in a Server Component as client references rather than as strings, so the
 * dashboard and the two error screens — which are server-rendered — could not use them.
 * Everything here is a string, so both sides import the same constants and the admin cannot
 * drift into two slightly different button heights.
 *
 * Sizes are the §9 hard minimums and the design board's measurements, expressed in tokens:
 *
 * - 56px (`h-14` / `control-lg`) is the floor for anything tappable; 88px (`control-xl`) for
 *   the two dashboard actions; 64px for the ↑ / ↓ pair where they sit in a divided strip.
 * - 2px borders. `fg-strong` for a panel or a control that carries weight, `fg` for an input
 *   the user is meant to type into, `line-strong` for the quieter Russian boxes and for
 *   anything dashed. 1px `line` only ever divides the inside of a panel.
 * - Labels 16px/600, body 18px, hints 16px, button labels 17–18px/600. Nothing under 16px:
 *   the board draws its own annotations at 9–12px, but those are annotations on a spec
 *   sheet, not screen furniture.
 * - `radius-panel` (8px) everywhere a control or panel has a corner; `radius-control` (4px)
 *   for photo previews and badges.
 *
 * Colour comes from tokens only. The board's swatch sheet still lists the pre-migration
 * `ink #16130F` and paints its primary fills at `#262320`; `globals.css` has since moved
 * `--color-ink` to the brand graphite `#2B2A26` and the handoff is explicit that every
 * primary fill is ink with a white label. So `bg-ink` is what is written here, not either
 * hex. Nothing in the admin uses the retired accent family any more.
 */

/* ------------------------------------------------------------------ layout */

/**
 * The one column. It is the same column on the phone and on the office computer — no
 * sidebar, no tabs, nothing to relearn — and it stops growing at 900px, above which it
 * centres. `px-gutter` is the fluid 20 → 64px page margin.
 */
export const adminColumn = 'mx-auto w-full max-w-[56.25rem] px-gutter';

/* ------------------------------------------------------------------- type */

/** 26px at 360, 30px from 640. The board's `800 26/1.1 −.02em`. */
export const adminH1 =
  'font-display text-[1.625rem] leading-[1.1] font-extrabold tracking-[-0.02em] ' +
  'text-fg-strong sm:text-[1.875rem]';

/** Section headings: „Tehtud tööd“, „Fotod“. */
export const adminH2 = 'font-display text-[1.25rem] leading-none font-extrabold text-fg-strong';

/** Dialog headings — 22px. */
export const adminH3 =
  'font-display text-[1.375rem] leading-[1.2] font-extrabold text-fg-strong';

/**
 * The heading on the two bare screens — the error boundary and not-found. 24px, and no
 * tracking adjustment: these are single sentences, not a page title over a stack of content.
 */
export const adminScreenTitle =
  'font-display text-[1.5rem] leading-[1.25] font-extrabold text-balance text-fg-strong';

/**
 * The frame those two screens sit in. Narrower than the admin column, because one sentence
 * and one button read badly across 900px.
 */
export const adminBareScreen =
  'mx-auto flex w-full max-w-form flex-col items-start gap-4 px-gutter py-11';

/** 18px body. The daylight-glare allowance: body text is `fg-strong`, never `fg`. */
export const adminBody = 'text-[1.125rem] leading-[1.5] text-fg-strong';

/**
 * 16px/600 field label. `leading-tight` rather than the board's `/1`, because „Märkus — ei
 * ole kohustuslik“ wraps to two lines at 360px and a line-height of 1 would set them solid.
 */
export const adminLabel = 'text-[1rem] leading-tight font-semibold text-fg-strong';

/** The one place `fg-muted` is allowed: lines he never has to read to make a decision. */
export const adminHint = 'text-[1rem] leading-[1.4] text-fg-muted';

/** The count beside a section heading — „3 tööd“, „5 / 30“. */
export const adminMeta = 'text-[1rem] leading-none text-fg-muted';

/** An error line under a field. Danger, and at label weight so it is not mistaken for a hint. */
export const adminFieldError = 'text-[1rem] leading-[1.4] font-semibold text-danger';

/* ---------------------------------------------------------------- controls */

/**
 * `min-h` rather than `h`: „Jah, kustuta lõplikult“ and „Mustand — kodulehel ei ole näha“
 * both wrap to two lines at 360px, and a fixed height would clip them.
 */
const controlBase =
  'inline-flex min-h-14 items-center justify-center gap-2.5 rounded-panel px-5 py-2 ' +
  'text-[1.0625rem] leading-tight font-semibold transition-colors ' +
  'disabled:cursor-not-allowed';

/**
 * The primary action: ink fill, white label — 14.36:1, the highest contrast pair the palette
 * has, which is the point on a screen being read in sunlight. Disabled falls to `fg-muted`,
 * which is what the board draws for the submitting state.
 */
export const adminControlPrimary =
  `${controlBase} bg-ink text-white text-[1.125rem] hover:bg-ink-raised active:bg-ink-raised ` +
  'disabled:bg-fg-muted disabled:hover:bg-fg-muted';

/**
 * The neutral control, and the resting state of anything that is not the primary action:
 * white ground, 2px `fg-strong`.
 */
export const adminControl =
  `${controlBase} border-2 border-fg-strong bg-page text-fg-strong ` +
  'hover:bg-surface-2 active:bg-surface-2 ' +
  'disabled:border-line disabled:bg-surface disabled:text-fg-muted';

/**
 * A destructive action **at rest**: white ground, 2px `danger` border, `danger` text
 * (6.57:1). Red is never a fill out on the page — it only becomes one inside the
 * confirmation dialog, where attention is already committed and there is nothing else to
 * mis-tap.
 */
export const adminControlDanger =
  `${controlBase} border-2 border-danger bg-page text-danger ` +
  'hover:bg-danger-soft active:bg-danger-soft ' +
  'disabled:border-line disabled:text-fg-muted';

/**
 * The same destructive action where the panel around it already draws the boundary — inside
 * a photo row's or a price row's divided control strip. Still 56px, still red text, no
 * border of its own because the 1px `line` dividers are the boundary.
 */
export const adminControlDangerQuiet =
  'inline-flex min-h-14 items-center justify-center gap-2 px-3 text-[1rem] leading-tight ' +
  'font-semibold text-danger transition-colors hover:bg-danger-soft active:bg-danger-soft ' +
  'disabled:text-fg-muted';

/**
 * A cell inside a panel's divided control strip: `Muuda`, ↑, ↓. No border, no radius — the
 * panel owns both — and 56px tall so the whole strip is one row of legal touch targets.
 */
export const adminStripCell =
  'inline-flex min-h-14 items-center justify-center gap-2 px-3 text-[1.0625rem] ' +
  'leading-tight font-semibold text-fg-strong transition-colors ' +
  'hover:bg-surface-2 active:bg-surface-2 disabled:text-fg-muted disabled:hover:bg-transparent';

/**
 * The two dashboard actions. 88px, full width, 20px label — big enough to hit without
 * looking, which is the entire brief for this screen.
 */
const heroBase =
  'flex min-h-22 w-full items-center justify-center rounded-panel px-6 text-center ' +
  'font-display text-[1.25rem] leading-snug font-semibold transition-colors';

export const adminHeroPrimary = `${heroBase} bg-ink text-white hover:bg-ink-raised active:bg-ink-raised`;

export const adminHeroSecondary =
  `${heroBase} border-2 border-fg-strong bg-page text-fg-strong ` +
  'hover:bg-surface-2 active:bg-surface-2';

/**
 * A text link that is also a 56px target: „Vaata kodulehte“, „Logi välja“, „Näita parooli“.
 * Underlined, because a link that is only a colour is not a link to someone who is not
 * comfortable with computers.
 */
export const adminTextLink =
  'inline-flex min-h-14 items-center justify-center gap-2 px-3 text-[1.0625rem] ' +
  'font-semibold text-fg underline underline-offset-[3px] transition-colors ' +
  'hover:text-fg-strong hover:bg-surface-2 rounded-panel';

/* ------------------------------------------------------------------ panels */

/** A job or a price row: white, 2px `fg-strong`, corners clipped so the strip sits flush. */
export const adminPanel = 'overflow-hidden rounded-panel border-2 border-fg-strong bg-page';

/** The same panel, quieter — a draft, or a photo that is not the cover. */
export const adminPanelQuiet = 'overflow-hidden rounded-panel border-2 border-line-strong bg-page';

/** The 1px rule that divides the inside of a panel. Never a boundary, only a division. */
export const adminDivider = 'border-line';

/**
 * The first-run and nothing-here-yet blocks, and the „+ Lisa rida“ control: dashed
 * `line-strong` on `surface`, so an empty area reads as waiting rather than as broken.
 */
export const adminEmptyPanel =
  'rounded-panel border-2 border-dashed border-line-strong bg-surface p-6 sm:p-7';

/** A standing notice that is neither an error nor a success — unsaved changes, the photo cap. */
export const adminNoticeQuiet =
  'rounded-panel border-2 border-line-strong bg-surface px-4 py-3 text-[1rem] ' +
  'leading-[1.45] font-semibold text-fg-strong';

/* -------------------------------------------------------------- sticky bar */

/**
 * The most-seen element in the admin: the ink band that keeps the one primary action inside
 * the bottom third of the screen, where a thumb reaches one-handed.
 *
 * `sticky` rather than `fixed`, so it stops covering the page once the form is scrolled
 * past, and `-mx-gutter` so the band runs edge to edge while its contents stay on the
 * column. The bottom padding carries the phone's home-indicator inset.
 */
export const adminStickyBar =
  'sticky bottom-0 z-10 -mx-gutter mt-2 border-t border-ink-line bg-ink px-gutter pt-3.5 shadow-bar';

export const adminStickyBarPadding = 'calc(1.125rem + env(safe-area-inset-bottom, 0px))';

/** The bar's primary action: white fill, ink label — the brightest thing on the screen. */
export const adminBarPrimary =
  `${controlBase} w-full bg-white text-[1.125rem] text-fg-strong ` +
  'hover:bg-on-ink active:bg-on-ink disabled:bg-fg-muted disabled:text-white';

/** The bar's secondary action: outlined in `on-ink`, which is 12.96:1 against the band. */
export const adminBarSecondary =
  `${controlBase} w-full border-2 border-on-ink bg-transparent text-on-ink ` +
  'hover:bg-ink-raised active:bg-ink-raised disabled:border-ink-line disabled:text-on-ink-muted';

/** The status line above the buttons, so the bar names the state before offering to change it. */
export const adminBarStatus = 'flex items-center gap-2 text-[1rem] leading-tight text-on-ink-muted';
