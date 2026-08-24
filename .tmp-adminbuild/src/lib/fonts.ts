import { JetBrains_Mono, Onest } from 'next/font/google';

/**
 * Two families. See docs/design/handoff.md — identity direction 5a "Masonry".
 *
 * ── WHY THESE TWO ───────────────────────────────────────────────────────────
 * Both ship the base `cyrillic` subset, which is the whole reason they were chosen: a third
 * of this site is Russian, and a face without Cyrillic fails silently. `subsets` would simply
 * omit the missing one, the build would pass, and every Russian page would render in Segoe UI
 * with nothing in review to catch it.
 *
 * The identity originally specified Lexend + Azeret Mono. Verified against
 * node_modules/next/dist/compiled/@next/font/dist/google/font-data.json (next 16.3.2):
 *
 *     Lexend       latin, latin-ext, vietnamese     ← no cyrillic, not even cyrillic-ext
 *     Azeret Mono  latin, latin-ext                 ← no cyrillic
 *     Onest        latin, latin-ext, cyrillic ✓
 *     JetBrains Mono  latin, latin-ext, cyrillic ✓
 *
 * Every Lexend sibling (Deca/Exa/Giga/Mega/Peta/Tera/Zetta) is Latin-only too, so there was no
 * in-family escape. Onest is the closest geometric-humanist substitute that draws Cyrillic
 * natively rather than through a fallback, and the identity was re-cut around it — the
 * delivered artwork in public/brand is rendered in these faces, not the originals.
 *
 * ── WHY ONLY ONE SANS LOADER ────────────────────────────────────────────────
 * The identity is a single family site-wide: display is Onest 800, which this loader already
 * carries. Calling `Onest()` a second time for `--font-mph-display` would emit a second
 * @font-face under a different family name and download the 800 weight twice for nothing.
 * `--font-display` in globals.css is declared as
 * `var(--font-mph-display), var(--font-mph-sans), …`, so leaving the display variable unbound
 * makes it fall through to this one — same file, no extra request. Bind it only if the
 * identity ever splits into two families again.
 *
 * Five font files total: three Onest weights, two mono. next/font self-hosts them at build
 * time, so no request ever leaves for fonts.googleapis.com — the performance position and the
 * GDPR position at once.
 * ────────────────────────────────────────────────────────────────────────────
 */

export const sans = Onest({
  variable: '--font-mph-sans',
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['400', '600', '800'],
  display: 'swap',
});

/** Eyebrows, meta rows, spec labels, and MEISTRID in the mark. */
export const mono = JetBrains_Mono({
  variable: '--font-mph-mono',
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['400', '500'],
  display: 'swap',
});

/**
 * `globals.css` reads `--font-mph-sans` and `--font-mph-mono`, so those names are a contract
 * rather than a preference. `--font-mph-display` is deliberately absent — see above.
 */
export const fontVariables = `${sans.variable} ${mono.variable}`;
