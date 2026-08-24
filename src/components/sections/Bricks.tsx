/**
 * The brick course — the 5a identity's recurring device, and the thing that replaces the
 * icon set the retired Direction A had.
 *
 * It is running bond: a row of solid rectangles whose widths are ratios, separated by
 * joints, with the next row's joints landing near the mid-points of the one above. That is
 * why the ratios below are never uniform — a row of equal bricks reads as a dashed rule,
 * not as masonry.
 *
 * `flexGrow` is the only inline style, because a brick's width is data (the ratio) rather
 * than a design token, and Tailwind cannot generate `flex-[2.2]` from a runtime value.
 * Everything paints in `currentColor`, so the caller decides ink or white by setting the
 * text colour on an ancestor — the same contract `Logo` uses.
 *
 * Lives under sections/ rather than brand/ because src/components/brand is owned by the
 * identity work; the footer imports it from here.
 */

type Props = {
  /** One array per course, each entry the flex ratio of a brick. */
  courses: readonly (readonly number[])[];
  /** Course height in px. */
  height: number;
  /** Joint width in px — also the gap between courses. */
  joint: number;
  /** The overall width. Left to the caller: some of these are 210px, one is full-bleed. */
  className?: string;
};

export function Bricks({ courses, height, joint, className = '' }: Props) {
  return (
    <span
      aria-hidden="true"
      className={`flex flex-col ${className}`.trim()}
      style={{ gap: joint }}
    >
      {courses.map((course, row) => (
        <span key={row} className="flex" style={{ gap: joint, height }}>
          {course.map((ratio, brick) => (
            <span key={brick} className="bg-current" style={{ flexGrow: ratio }} />
          ))}
        </span>
      ))}
    </span>
  );
}

/* The named courses used across the page, so a ratio is written once. */

/** The 210px hero divider and the footer strips: two courses, joints staggered. */
export const RUNNING_BOND = [
  [1, 2.2, 2.2, 1],
  [2.2, 2.2, 2.2],
] as const;

/** The footer's wider five-brick strips. */
export const FOOTER_BOND = [
  [1.4, 2.6, 1.8, 2.2, 1.2],
  [2.4, 1.4, 2.6, 1.6, 2],
] as const;

/** The two-brick glyph that heads each process step. */
export const GLYPH_TWO = [[1, 2]] as const;

/** The three-brick glyph on the panels (quote confirmation, price disclaimer). */
export const GLYPH_THREE = [[1, 2, 1]] as const;
