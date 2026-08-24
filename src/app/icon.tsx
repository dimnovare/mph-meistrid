import { ImageResponse } from 'next/og';

/**
 * TEMPORARY favicon, generated at build time from the brand accent.
 *
 * Replace with the real icon once the identity lands: drop `icon.svg` into `src/app/`
 * (Next serves it directly, no code needed) and delete this file. See
 * `src/components/brand/Logo.tsx` for the full swap procedure.
 */
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // Kept in sync with --color-accent / --color-on-accent in globals.css by hand:
          // this runs in Satori, which cannot read the stylesheet.
          background: '#e2600f',
          color: '#14120f',
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: '-0.04em',
        }}
      >
        MPH
      </div>
    ),
    size,
  );
}
