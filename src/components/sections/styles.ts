/**
 * The public site's shared treatments, as class strings.
 *
 * The parallel of `src/components/admin/styles.ts`, for the half of the app the admin does
 * not share. It lives under sections/ because that is where most of it is used; the header
 * and footer import from here, which is the one direction of cross-import in this codebase.
 *
 * ── WHY NOT `@/components/ui/Button` ────────────────────────────────────────
 * That primitive's `primary` variant is `bg-accent text-on-accent`, and the 5a identity
 * retires the accent family from the public site: every primary action is now an ink fill
 * with a white label (14.36:1). Passing `className="bg-ink"` would not fix it — Tailwind
 * orders same-property utilities by their position in the theme, and `--color-accent` is
 * declared after `--color-ink`, so `bg-accent` wins the cascade no matter which class is
 * written last. The same trap applies to `rounded-control` vs the square `rounded-none` 5a
 * asks for. The button primitive is shared with the admin and is not ours to repoint, so
 * the public site brings its own.
 *
 * Class strings, not components, because the call sites need three different elements —
 * `<a href="tel:">`, `<button type="submit">` and next-intl's `Link` — and a polymorphic
 * wrapper around all three buys nothing over a string.
 *
 * Focus is deliberately absent everywhere below: `:focus-visible` in globals.css draws one
 * ring for the whole site and inverts it inside `.on-ink`. Never override it here.
 * ────────────────────────────────────────────────────────────────────────────
 */

/**
 * The content frame: 1200px measure, 20px side padding, 32px from 720px up.
 *
 * `@/components/ui/Container` is not used on the landing page because its `px-gutter` is a
 * fluid clamp that reads ~37px at the 720px breakpoint, where the handoff asks for a hard
 * 20/32 step. Project pages and the gallery still use `Container` — they were designed
 * against it and nothing about them changed.
 *
 * 45rem is 720px, the single breakpoint the whole mobile layer switches on.
 */
export const FRAME = 'mx-auto w-full max-w-[75rem] px-5 min-[45rem]:px-8';

/**
 * The h2 + mono strip row that heads Teenused and Objektid.
 *
 * It wraps rather than truncating, and the strip carries no `nowrap`: the Russian strings
 * are materially longer than the Estonian ones and "СТРОИТЕЛЬСТВО · РЕНОВАЦИЯ · ОТДЕЛКА"
 * tracked at .18em does not share a 360px line with a heading.
 */
export const SECTION_HEAD = 'flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2';

type Variant =
  /** Primary action on a light section: graphite fill, white label. */
  | 'ink'
  /** Primary action inside an ink band: the fill inverts so it stays visible. */
  | 'onInk'
  /** Secondary action inside an ink band: 2px white outline, no fill. */
  | 'onInkOutline'
  /** Secondary action on a light section — the file picker, the mobile call button. */
  | 'outline';

type Size =
  /** 48px — the public control height. Hero, form, mobile menu. */
  | 'default'
  /** 44px — the touch-target floor, for the header's CTA where 48 would crowd the bar. */
  | 'compact'
  /** 48px tall but half the side padding: two labels sharing the 360px mobile call bar. */
  | 'bar';

/**
 * Square corners, `font-sans` at 600 — the identity is one family, so the sans and the
 * display role are the same Onest files and the weight is what distinguishes a button label
 * from a heading. `shadow-edge` goes with the accent: the 5a button is a flat graphite block.
 *
 * No `whitespace-nowrap`, and the sizes below are `min-h-*` rather than a fixed height.
 * "Запросить предложение" is 21 characters and does not fit a 360px phone next to anything
 * else; nowrap turns that into an overflow (or, with `overflow-x: clip` catching it, into a
 * label with its right half missing), where wrapping turns it into a two-line button that
 * grows to fit. The vertical padding is what keeps a wrapped label off the border.
 */
const base =
  'inline-flex items-center justify-center gap-2.5 rounded-none py-2 ' +
  'font-sans font-semibold text-center transition-colors duration-fast select-none ' +
  'disabled:pointer-events-none disabled:opacity-50';

const variants: Record<Variant, string> = {
  // Hover lifts to `ink-raised` rather than darkening. There is no token below `ink`, and a
  // "raised" hover is the same move the admin's ink surfaces make; white stays 10.57:1 on it.
  ink: 'bg-ink text-white hover:bg-ink-raised active:bg-ink-raised',
  onInk: 'bg-on-ink text-ink hover:bg-white active:bg-white',
  onInkOutline: 'border-2 border-on-ink text-on-ink hover:bg-ink-raised active:bg-ink-raised',
  // `line-strong`, never `line`: this border is the control's only visible boundary, so it
  // has to clear 3:1 on its own (WCAG 1.4.11, and the note on the token in globals.css).
  outline:
    'border-[1.5px] border-line-strong bg-page text-fg-strong hover:bg-surface active:bg-surface',
};

/**
 * A size, not a `px-3` appended at the call site: two competing padding utilities are
 * resolved by their order in the generated stylesheet, and `.px-3` sorts before `.px-6`, so
 * the override would silently lose.
 */
const sizes: Record<Size, string> = {
  default: 'min-h-control px-6 text-small',
  compact: 'min-h-tap px-5 text-small',
  bar: 'min-h-control px-3 text-small',
};

export function actionClasses(variant: Variant = 'ink', size: Size = 'default'): string {
  return `${base} ${variants[variant]} ${sizes[size]}`;
}

/**
 * The text link that pairs with a filled button — hero secondary, "send another enquiry".
 * A 2px rule under the label rather than a border on the box, so it reads as a link and not
 * as a second button competing with the first.
 *
 * Two classes because the rule and the touch target want different boxes: the anchor is 44px
 * tall so a thumb can hit it, and the rule sits tight under the text inside that box.
 * `<a className={UNDERLINE_LINK}><span className={UNDERLINE_RULE}>…</span></a>`.
 */
export const UNDERLINE_LINK =
  'inline-flex min-h-tap items-center whitespace-nowrap font-sans text-small ' +
  'font-semibold text-fg-strong transition-colors duration-fast hover:text-fg-muted';

export const UNDERLINE_RULE = 'border-b-2 border-current pb-1';

/**
 * The mono voice: kickers, spec strips, meta rows and the contact rail's labels. The 5a
 * identity's third face after the sans and its 800 display weight, and the thing that makes
 * a section heading read as a drawing label rather than as a subtitle.
 *
 * No colour and no `uppercase` here on purpose. The colour flips between `fg-muted` on light
 * and `on-ink-muted` inside a band, and most of the strings are already capitalised in the
 * catalogue — only a project's own location has to be transformed.
 *
 * Three complete constants rather than one plus a `tracking-*` override at the call site.
 * Tailwind resolves two competing `letter-spacing` utilities by their order in the generated
 * stylesheet, not by the order they are written in the class attribute, so an override would
 * work or not work depending on which arbitrary value happened to sort later — which is a
 * coin flip, not a rule.
 */
const MONO_BASE = 'font-mono text-small font-medium';

/** Spec strips, meta rows, contact-rail labels, process and service indices. */
export const MONO_LABEL = `${MONO_BASE} tracking-[0.18em]`;

/** The hero kicker, tracked one step wider. */
export const MONO_KICKER = `${MONO_BASE} tracking-[0.22em]`;

/** The footer's bottom rule row — a long line, so it is tracked one step tighter. */
export const MONO_META = `${MONO_BASE} tracking-[0.1em]`;

/**
 * The quote form's text controls.
 *
 * Written out here rather than composed onto `Input`/`Textarea` from `@/components/ui/Field`
 * for the cascade reason in the header comment: the primitive's `rounded-control` would beat
 * a `rounded-none` passed alongside it, and 5a's fields are square. `Field` itself is still
 * used — it owns the `<label htmlFor>`, the error text and the aria wiring, which is the
 * part that matters.
 *
 * `border-line-strong`, not the prototype's `#DDD9D2` → `line`. A field's border is the
 * control's only visible boundary, so it has to clear 3:1 on its own (WCAG 1.4.11); `line`
 * is 1.3:1 on white and globals.css names it decorative-only. This is the one place the
 * handoff's colour call is not followed.
 *
 * Text is `text-body`, which floors at 16px: below that iOS Safari zooms the page on focus
 * and does not zoom back out.
 */
export const FIELD_CONTROL =
  'w-full rounded-none border-[1.5px] border-line-strong bg-page px-4 text-body ' +
  'text-fg-strong placeholder:text-fg-muted transition-colors duration-fast ' +
  'hover:border-fg-muted focus:border-ink aria-invalid:border-danger ' +
  'disabled:bg-surface-2 disabled:text-fg-muted';

/**
 * The bordered panel: quote confirmation, price disclaimer, empty project grid. A 1.5px ink
 * rule around a block with a brick glyph in the corner — the prototype's one "notice"
 * device, and what replaces the retired `accent-soft` tint block.
 */
export const INK_PANEL = 'flex flex-col items-start gap-4 border-[1.5px] border-ink p-7';
