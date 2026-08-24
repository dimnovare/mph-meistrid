/**
 * MPH Meistrid — the mark. Identity direction **5a "Masonry"**
 * (docs/design/MPH Meistrid Identity.dc.html, option 5a; board 2a for the version logic).
 *
 * ── WHY THIS IS DRAWN AND NOT <img> ─────────────────────────────────────────
 * The delivered `public/brand/*.svg` files are structural sources, not runtime assets: they
 * set MPH, MEISTRID and the horizontal wordmark as `<text>`, so an `<img>` of one renders in
 * whatever font the *browser* happens to have rather than the font this site loads, and the
 * handoff explicitly says to convert them to outlines before print. Drawn inline instead,
 * the mark uses the site's own type, inherits `currentColor` for the light/ink renditions,
 * costs no extra request, and — because the box is a fixed ratio of `height` — reserves its
 * space before any font arrives, so the header never shifts.
 *
 * ── HOW THE MARK IS CONSTRUCTED ─────────────────────────────────────────────
 * Every dimension is a ratio, so all three lockups scale from `height` alone. The masonry is
 * running bond: courses of solid bricks whose joints are offset course to course, which is
 * why the ratios below are 1 / 2.2 / 2.2 / 1 over 2.2 / 2.2 / 2.2 — the short end bricks in
 * the upper course put its joints at the mid-points of the lower one.
 *
 * `primary` — the full stacked lockup, for ink bands and anywhere the mark is the subject.
 *   MPH in the display face at weight 800, tracked −0.05em, centred over a **foundation
 *   slab** that overhangs the wordmark by 0.146× the font size on each side. The slab is
 *   0.31× tall and carries MEISTRID in the mono face at 0.146×, tracked .4em — **knocked
 *   out**, i.e. a real hole in the slab through which whatever sits behind shows, which is
 *   what an SVG `<mask>` is for and what no CSS property does. Under it two brick courses,
 *   each 0.115× tall, separated from the slab and from each other by 0.021× joints.
 *
 * `horizontal` — the small-size lockup: the tile, a 0.367× gap, then "MPH MEISTRID" at 0.5×
 *   the tile. This is what the header and footer use; the stacked lockup's MEISTRID line
 *   would be under 3px there.
 *
 * `mark` — the tile alone. A square outlined at 0.05× its size holding an 800-weight M at
 *   0.5×, standing on a single 3-brick course (1 / 2 / 1) that is 0.2× tall. Favicon, avatar.
 *
 * The slab, the courses and the tile are pure geometry — no font metric touches them, and
 * the vertical stack was checked against the delivered logo-primary.png: every boundary
 * lands within 0.001 of the ratios above. The type is set at its natural width and *centred*
 * on that geometry rather than stretched to fit with `textLength`, so a face other than the
 * specified Lexend 800 / Azeret Mono degrades to a slightly different overhang instead of to
 * distorted letterforms. That matters today, because neither of those families ships a
 * Cyrillic subset and the loader is still on Fira Sans — see the migration note in
 * src/lib/fonts.ts. Nothing here has to change when that is settled: the two advance
 * constants below are already the real Lexend measurements, so binding it makes the mark
 * exact rather than moving it.
 * ────────────────────────────────────────────────────────────────────────────
 */

type Variant = 'primary' | 'horizontal' | 'mark';

type Props = {
  variant?: Variant;
  /** Rendered height in px. The header uses 26 on mobile and 32 from lg up. */
  height?: number;
  /**
   * The light rendition, for ink bands and photos — `--color-on-ink` instead of
   * `currentColor`. Matches the delivered `logo-primary-light` artwork. Leave it off and the
   * mark is `currentColor`, so the caller keeps control of the colour.
   */
  onInk?: boolean;
  className?: string;
};

export function Logo({ variant = 'horizontal', height = 28, onInk = false, className }: Props) {
  return (
    <span
      className={className}
      style={{
        height,
        display: 'inline-flex',
        alignItems: 'center',
        ...(onInk ? { color: 'var(--color-on-ink)' } : null),
      }}
      // The mark is decorative when it sits inside a link that already names the company.
      // Callers that need it announced pass their own accessible name on the link.
      aria-hidden="true"
    >
      {variant === 'primary' ? (
        <Primary height={height} />
      ) : variant === 'mark' ? (
        <Tile size={height} />
      ) : (
        <Horizontal height={height} />
      )}
    </span>
  );
}

/* ────────────────────────────── the recipe ─────────────────────────────── */

/**
 * Advance of "MPH" set in Onest 800 at −0.05em, as a multiple of the font size. The slab is
 * this plus an overhang at each end, so it is the one number that decides whether the
 * overhang really is the 0.146× the recipe asks for.
 *
 * Taken from the corrected artwork: logo-primary.svg is a 237.7-wide box at font-size 100
 * with 14.6 of overhang each side, so the wordmark advances 237.7 − 29.2 = 208.5.
 *
 * This was 2.197 while the identity was set in Lexend, and the delivered files at that point
 * placed the wordmark by its origin x rather than by its ink, which leant it 40px right of
 * the slab centre in a 1046px render. Both are now fixed upstream — the artwork centres with
 * `text-anchor="middle"` and a dx of half the trailing letter-spacing, and the handoff
 * records the rule. Measured on the re-render: 61 left against 62 right, i.e. centred.
 */
const MPH_ADVANCE = 2.085;
/**
 * Advance of "MPH MEISTRID" expressed against the *tile* size rather than the font size,
 * because that is what the horizontal lockup is measured in: logo-horizontal.svg is 151 wide
 * on a 30 tile with an 11 gap, so the wordmark box is 110 = 3.667 tiles.
 *
 * Was 4.05 against the old artwork's 176-wide box, which left ~13 units of dead air off the
 * end of the wordmark. Also corrected upstream.
 */
const LOCKUP_ADVANCE = 3.6667;

/** Joints thinner than this stop reading as joints and the courses merge into a bar. */
const MIN_JOINT = 1.5;

const OVERHANG = 0.146; /* slab past the wordmark, each side */
const SLAB_HEIGHT = 0.31;
const COURSE_HEIGHT = 0.115;
const JOINT = 0.021;
const MONO_SIZE = 0.146; /* MEISTRID */
const MONO_TRACK = 0.4;
/* Top of the box to the MPH baseline. Onest's cap height differs from Lexend's, which is
   why this is 0.72 and not the 0.70 the first cut used: the corrected artwork is 139.6 tall
   at font-size 100, and 0.72 + 0.094 + 0.31 + 2×0.115 + 2×0.021 = 1.396. */
const CAP_TO_BASELINE = 0.72;
const BASELINE_TO_SLAB = 0.094;
/** Everything except the two joints, as a multiple of the font size. */
const STACK = CAP_TO_BASELINE + BASELINE_TO_SLAB + SLAB_HEIGHT + 2 * COURSE_HEIGHT;

const UPPER_COURSE = [1, 2.2, 2.2, 1] as const;
const LOWER_COURSE = [2.2, 2.2, 2.2] as const;

const TILE_BORDER = 0.05;
const TILE_COURSE = 0.2;
const TILE_JOINT = 0.067;
const TILE_M = 0.5;
const TILE_BRICKS = [1, 2, 1] as const;
/** Optical: the M sits fractionally below the geometric centre of the tile's box. */
const TILE_M_NUDGE = 0.0167;

/** Gap between the tile and the wordmark in the horizontal lockup. */
const LOCKUP_GAP = 0.3667;

/** Two decimals is under a thousandth of a px at every size this renders at. */
const r = (n: number) => Math.round(n * 100) / 100;

/** One course of running bond: `ratios` bricks sharing `total` minus the joints between. */
function bond(total: number, joint: number, ratios: readonly number[]) {
  const unit = (total - joint * (ratios.length - 1)) / ratios.reduce((sum, n) => sum + n, 0);
  let x = 0;
  return ratios.map((ratio) => {
    const width = unit * ratio;
    const brick = { x: r(x), width: r(width) };
    x += width + joint;
    return brick;
  });
}

/* ──────────────────────────────── lockups ──────────────────────────────── */

function Primary({ height }: { height: number }) {
  // height = STACK · fontSize + 2 · joint, and joint = JOINT · fontSize until it hits the
  // floor — below which the joint is fixed and the font size takes up the difference.
  let fontSize = height / (STACK + 2 * JOINT);
  let joint = JOINT * fontSize;
  if (joint < MIN_JOINT) {
    joint = MIN_JOINT;
    fontSize = (height - 2 * joint) / STACK;
  }

  const width = (MPH_ADVANCE + 2 * OVERHANG) * fontSize;
  const slabY = (CAP_TO_BASELINE + BASELINE_TO_SLAB) * fontSize;
  const slabHeight = SLAB_HEIGHT * fontSize;
  const courseHeight = COURSE_HEIGHT * fontSize;
  const upperY = slabY + slabHeight + joint;
  const lowerY = upperY + courseHeight + joint;
  const monoSize = MONO_SIZE * fontSize;
  const track = MONO_TRACK * monoSize;

  // One id per size. Two lockups of the same height share mask geometry, so a duplicate id
  // resolves to an identical mask; different heights get different ids and cannot collide.
  const maskId = `mph-slab-${r(height)}`;

  return (
    <svg
      width={r(width)}
      height={r(height)}
      viewBox={`0 0 ${r(width)} ${r(height)}`}
      fill="currentColor"
      role="presentation"
      focusable="false"
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Luminance mask: white keeps the slab, black cuts MEISTRID out of it. The letters
            are a hole, not white ink, so the slab shows the band, photo or page behind. */}
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x={0}
          y={r(slabY)}
          width={r(width)}
          height={r(slabHeight)}
        >
          <rect x={0} y={r(slabY)} width={r(width)} height={r(slabHeight)} fill="#fff" />
          <text
            className="font-mono"
            x={r(width / 2)}
            // Half the tracking back to the right: the trailing letter-space is counted into
            // the advance the anchor centres on, so without this the word sits left of centre.
            dx={r(track / 2)}
            y={r(slabY + slabHeight / 2)}
            fontSize={r(monoSize)}
            fontWeight={400}
            letterSpacing={r(track)}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#000"
          >
            MEISTRID
          </text>
        </mask>
      </defs>

      <text
        className="font-display"
        x={r(width / 2)}
        y={r(CAP_TO_BASELINE * fontSize)}
        fontSize={r(fontSize)}
        fontWeight={800}
        letterSpacing={r(-0.05 * fontSize)}
        textAnchor="middle"
      >
        MPH
      </text>

      <rect
        x={0}
        y={r(slabY)}
        width={r(width)}
        height={r(slabHeight)}
        mask={`url(#${maskId})`}
      />

      {bond(width, joint, UPPER_COURSE).map((brick) => (
        <rect
          key={`u${brick.x}`}
          x={brick.x}
          y={r(upperY)}
          width={brick.width}
          height={r(courseHeight)}
        />
      ))}
      {bond(width, joint, LOWER_COURSE).map((brick) => (
        <rect
          key={`l${brick.x}`}
          x={brick.x}
          y={r(lowerY)}
          width={brick.width}
          height={r(courseHeight)}
        />
      ))}
    </svg>
  );
}

function Horizontal({ height }: { height: number }) {
  const gap = LOCKUP_GAP * height;
  const fontSize = TILE_M * height;
  const width = height + gap + LOCKUP_ADVANCE * height;

  return (
    <svg
      width={r(width)}
      height={r(height)}
      viewBox={`0 0 ${r(width)} ${r(height)}`}
      fill="currentColor"
      role="presentation"
      focusable="false"
      // A face wider than the one the box was measured against should spill, not be cut off
      // mid-word. Nothing sits close enough on the right for that to collide.
      style={{ overflow: 'visible' }}
    >
      <TileShapes size={height} />
      <text
        className="font-display"
        x={r(height + gap)}
        y={r(height / 2)}
        fontSize={r(fontSize)}
        fontWeight={800}
        letterSpacing={r(-0.01 * fontSize)}
        dominantBaseline="central"
      >
        MPH MEISTRID
      </text>
    </svg>
  );
}

function Tile({ size }: { size: number }) {
  return (
    <svg
      width={r(size)}
      height={r(size)}
      viewBox={`0 0 ${r(size)} ${r(size)}`}
      fill="currentColor"
      role="presentation"
      focusable="false"
    >
      <TileShapes size={size} />
    </svg>
  );
}

/** The compact tile, drawn into whichever SVG needs it. Occupies `size` × `size`. */
function TileShapes({ size }: { size: number }) {
  const joint = Math.max(TILE_JOINT * size, MIN_JOINT);
  const courseHeight = TILE_COURSE * size;
  const boxHeight = size - joint - courseHeight;
  const border = TILE_BORDER * size;

  return (
    <>
      {/* Inset by half the stroke so the whole border lands inside the tile rather than
          bleeding half of it outside the box the caller reserved. */}
      <rect
        x={r(border / 2)}
        y={r(border / 2)}
        width={r(size - border)}
        height={r(boxHeight - border)}
        fill="none"
        stroke="currentColor"
        strokeWidth={r(border)}
      />
      <text
        className="font-display"
        x={r(size / 2)}
        y={r(boxHeight / 2 + TILE_M_NUDGE * size)}
        fontSize={r(TILE_M * size)}
        fontWeight={800}
        textAnchor="middle"
        dominantBaseline="central"
      >
        M
      </text>
      {bond(size, joint, TILE_BRICKS).map((brick) => (
        <rect
          key={`t${brick.x}`}
          x={brick.x}
          y={r(size - courseHeight)}
          width={brick.width}
          height={r(courseHeight)}
        />
      ))}
    </>
  );
}
