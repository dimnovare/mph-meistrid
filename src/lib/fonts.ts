import { Fira_Sans, Fira_Sans_Condensed } from 'next/font/google';

/**
 * Two families, three weight files. See docs/design-system.md §4.
 *
 * Both faces ship the base `cyrillic` subset, which is the whole reason they were chosen —
 * a third of this site is Russian. Several obvious "industrial" alternatives do not:
 * Archivo, Barlow Condensed and Space Grotesk have no Cyrillic at all, and IBM Plex Sans
 * Condensed ships only `cyrillic-ext`, which does not contain the Russian alphabet and
 * would have rendered every Russian page in a fallback font without any build error.
 *
 * Condensed is load-bearing rather than decorative: "siseviimistlustööd" measures 256px at
 * the 36px h1 minimum, inside 320px of available width at a 360px viewport.
 *
 * next/font self-hosts these at build time, so no request ever leaves for
 * fonts.googleapis.com — the performance position and the GDPR position at once.
 *
 * ── 5a IDENTITY MIGRATION: BLOCKED, NOT SKIPPED ─────────────────────────────
 * docs/design/handoff.md asks for Lexend 400/600/800 as sans + display and Azeret Mono
 * 400/500 as a new mono token. Checked against
 * node_modules/next/dist/compiled/@next/font/dist/google/font-data.json (next 16.3.2):
 *
 *     Lexend       subsets: latin, latin-ext, vietnamese     ← no cyrillic
 *     Lexend Deca  subsets: latin, latin-ext, vietnamese     ← no cyrillic
 *     Azeret Mono  subsets: latin, latin-ext                 ← no cyrillic
 *
 * Neither family has `cyrillic`, and neither has even `cyrillic-ext`. Every Lexend* sibling
 * (Deca/Exa/Giga/Mega/Peta/Tera/Zetta) is Latin-only too, so there is no in-family escape.
 * Shipping them would compile — `subsets` would simply omit cyrillic — and then render the
 * entire Russian half of the site in Segoe UI / system mono with no build error and nothing
 * in review to catch it. That is exactly the failure mode this comment was written to
 * prevent, so the swap is NOT applied here.
 *
 * Fira Sans / Fira Sans Condensed stay until the identity picks Cyrillic-capable faces.
 * Cyrillic-capable monos available through next/font/google, if a stand-in for Azeret Mono
 * is wanted: JetBrains Mono, IBM Plex Mono, Roboto Mono, Geist Mono, Martian Mono,
 * Source Code Pro. There is no close Lexend substitute with Cyrillic — that one is a brand
 * decision, not an engineering one.
 *
 * When a family is agreed, this file is the only thing that changes: bind the third loader
 * variable `--font-mph-mono`, which `--font-mono` in globals.css already reads, and add its
 * `.variable` to `fontVariables` below. Nothing that consumes `font-mono`, `font-sans` or
 * `font-display` has to move — including src/components/brand/Logo.tsx, whose geometry is
 * already final and whose letterforms come from these tokens.
 * ────────────────────────────────────────────────────────────────────────────
 */

export const sans = Fira_Sans({
  variable: '--font-mph-sans',
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['400', '600'],
  display: 'swap',
});

export const display = Fira_Sans_Condensed({
  variable: '--font-mph-display',
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['700'],
  display: 'swap',
});

/**
 * `globals.css` binds `--font-sans` and `--font-display` to these two variable names, so the
 * names above are a contract, not a preference. `--font-mono` reads a third name,
 * `--font-mph-mono`, which nothing sets yet (see the migration note above); its fallback is
 * written inside the `var()` in globals.css so the declaration stays valid meanwhile.
 */
export const fontVariables = `${sans.variable} ${display.variable}`;
