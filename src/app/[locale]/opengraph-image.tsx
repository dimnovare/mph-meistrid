import { ImageResponse } from 'next/og';

import { site } from '@/content/site';

/**
 * The card Facebook, Messenger and WhatsApp show when someone shares the site. For an
 * Estonian trades business that is mostly Facebook, and mostly a phone.
 *
 * Text here is deliberately Latin-only and identical for both locales. `ImageResponse`
 * renders through Satori, which needs real font data for every glyph it draws and only has
 * the bundled Latin face available — Cyrillic would come out as empty boxes. Loading a
 * Cyrillic TTF would mean either a build-time network fetch or a vendored binary, to put
 * Russian text on an image whose job is to carry the brand. The Russian description already
 * reaches the crawler through the `og:description` meta tag, which is where it belongs.
 *
 * Replace this with the real identity once it lands: the simplest swap is a static
 * `opengraph-image.png` file in this folder, which Next serves directly and which costs no
 * build-time render at all.
 */

export const alt = 'MPH Meistrid';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Kept in sync by hand with the tokens in globals.css — Satori cannot read the stylesheet.
const INK = '#16130F';
const ON_INK = '#F5F3EF';
const ON_INK_MUTED = '#B5AFA4';
const ACCENT = '#E2600F';

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: INK,
          padding: 72,
        }}
      >
        {/* The accent rule is the recurring motif of the site; it stands in for the mark. */}
        <div style={{ display: 'flex', width: 120, height: 10, background: ACCENT }} />

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 132,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: ON_INK,
              lineHeight: 1,
            }}
          >
            MPH MEISTRID
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 24,
              fontSize: 40,
              color: ACCENT,
              letterSpacing: '0.02em',
            }}
          >
            Ehitus · Remont · Siseviimistlus
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 28,
            color: ON_INK_MUTED,
          }}
        >
          {`${site.legalName} · Registrikood ${site.registryCode}`}
        </div>
      </div>
    ),
    size,
  );
}
