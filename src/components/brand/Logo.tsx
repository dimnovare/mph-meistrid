/**
 * TEMPORARY LOGO PLACEHOLDER.
 *
 * The real MPH Meistrid identity is being designed separately (see
 * `docs/Claude Design Prompt — MPH Meistrid Logo & Identity.md`). This renders a typographic
 * stand-in built from the site's own display face, so the layout is correct now and the swap
 * later changes one file.
 *
 * ── HOW TO SWAP IN THE REAL LOGO ────────────────────────────────────────────
 * 1. Drop the delivered files into `public/brand/`:
 *      logo-horizontal.svg   dark version, for light backgrounds (header, most of the site)
 *      logo-horizontal-light.svg   light version, for ink bands (footer, hero scrim)
 *      mark.svg              the compact MPH mark
 *      icon.svg              square, for the favicon and social avatar
 * 2. Replace the `<Wordmark>` and `<Mark>` bodies below with an <img> or an inlined <svg>.
 *    Inlining is preferred for the header: it is a handful of paths, it inherits
 *    `currentColor` so one file serves both the light and ink contexts, and it costs no
 *    extra request on the critical path.
 * 3. Keep the outer element's height contract intact — `height` is what every caller sizes
 *    against, and the header reserves exactly this much space. Do not switch to a
 *    width-driven layout, or the header will shift as the font loads.
 * 4. Regenerate the favicon from `icon.svg` and delete `src/app/favicon.ico`.
 *
 * Nothing else in the codebase knows what the logo looks like.
 * ────────────────────────────────────────────────────────────────────────────
 */

type Variant = 'horizontal' | 'mark';

type Props = {
  variant?: Variant;
  /** Rendered height in px. The header uses 28 on mobile and 34 from lg up. */
  height?: number;
  /**
   * Ink bands flip the accent to its lighter tint. Everything else inherits `currentColor`,
   * so the caller controls the main colour.
   */
  onInk?: boolean;
  className?: string;
};

export function Logo({ variant = 'horizontal', height = 28, onInk = false, className }: Props) {
  return (
    <span
      className={className}
      style={{ height, display: 'inline-flex', alignItems: 'center' }}
      // The wordmark is decorative when it sits inside a link that already names the company.
      // Callers that need it announced pass their own accessible name on the link.
      aria-hidden="true"
    >
      {variant === 'mark' ? <Mark height={height} onInk={onInk} /> : <Wordmark height={height} onInk={onInk} />}
    </span>
  );
}

/**
 * MPH set solid, with MEISTRID as a spaced descriptor beneath it — the structure the brand
 * brief asks for, so the real mark will drop into the same footprint.
 */
function Wordmark({ height, onInk }: { height: number; onInk: boolean }) {
  return (
    <span
      className="font-display leading-none"
      style={{ display: 'inline-flex', flexDirection: 'column', gap: height * 0.08 }}
    >
      <span
        style={{
          fontSize: height * 0.72,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        MPH
        {/* The accent bar stands in for the geometric device the real mark will carry. */}
        <span
          aria-hidden="true"
          className={onInk ? 'bg-accent-on-ink' : 'bg-accent'}
          style={{
            display: 'inline-block',
            width: height * 0.16,
            height: height * 0.16,
            marginLeft: height * 0.1,
            verticalAlign: 'baseline',
          }}
        />
      </span>
      <span
        style={{
          fontSize: height * 0.24,
          fontWeight: 600,
          letterSpacing: '0.22em',
          lineHeight: 1,
        }}
      >
        MEISTRID
      </span>
    </span>
  );
}

/** Compact square mark. Used where MEISTRID would be unreadable: avatars, app icon, favicon. */
function Mark({ height, onInk }: { height: number; onInk: boolean }) {
  return (
    <span
      className={`font-display ${onInk ? 'bg-accent-on-ink text-ink' : 'bg-accent text-on-accent'}`}
      style={{
        width: height,
        height,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: height * 0.42,
        fontWeight: 700,
        letterSpacing: '-0.03em',
      }}
    >
      MPH
    </span>
  );
}
