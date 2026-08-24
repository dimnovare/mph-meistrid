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
 * names above are a contract, not a preference.
 */
export const fontVariables = `${sans.variable} ${display.variable}`;
