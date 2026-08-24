# Brand assets — MPH Meistrid, identity 5a "Masonry"

The delivered identity. Direction **5a** from `docs/design/MPH Meistrid Identity.dc.html`
(board 2a carries the version logic); the geometry recipe is in `docs/design/handoff.md`.
Everything here is drawn at the brand graphite **`#2B2A26`** — the same value as
`--color-ink` in `src/app/globals.css`. The retired black-and-orange Direction A is gone.

## What the mark is

A wordmark over a **foundation slab**. MPH is set in Lexend 800 tracked −0.05em; the slab
runs 0.146× the font size wider than the letters on each side and carries `MEISTRID` in
Azeret Mono 400 tracked .4em, **knocked out** — the letters are a hole, so the slab shows
whatever sits behind it. Under the slab, two courses of brick in running bond
(1 / 2.2 / 2.2 / 1 over 2.2 / 2.2 / 2.2), 0.021× joints. The compact tile is an outlined
square holding an 800-weight M, standing on a single 1 / 2 / 1 course.

## Files

| File | Size | What it is |
| --- | --- | --- |
| `logo-primary.png` | 1056×632 | Stacked lockup, graphite, transparent background |
| `logo-primary-light.png` | 1056×632 | Same, white — for ink bands and photos |
| `logo-primary.svg` | 243.9×137.6 | Structural source for the stacked lockup |
| `logo-horizontal.svg` | 176×30 | Structural source: tile + "MPH MEISTRID" |
| `logo-mark.svg` | 30×30 | Structural source for the compact tile |
| `logo-mark-512.png` | 512×512 | Tile, graphite on white — avatars, directories |
| `logo-mark-ink-512.png` | 512×512 | Tile inverted, for dark avatars |
| `favicon-32.png` / `favicon-16.png` | 32 / 16 | Browser tab |
| `apple-touch-icon-180.png` | 180×180 | iOS home screen |
| `og-image-1200x630.png` | 1200×630 | Light lockup + services strip on graphite |

MEISTRID is a true knockout in every rendition, so the PNG lockups have real alpha there:
do not flatten them onto a background that is not the one they will sit on.

## How the site uses them

**The site does not load any file in this folder.** Two reasons, and they are worth knowing
before someone "simplifies" this:

1. The three `.svg` files set MPH, MEISTRID and the wordmark as `<text>` in Lexend / Azeret
   Mono. Referenced from an `<img>` or `background-image`, an SVG cannot use the fonts the
   page loads — it gets whatever the *browser* has, which is neither of those. So these are
   **structural sources**, not runtime assets. Before any print or vinyl use, convert the
   text to outlines first, as the handoff says.
2. `src/components/brand/Logo.tsx` redraws the mark inline instead, from the ratios above.
   That gives it the site's own type, `currentColor` for the light and graphite renditions,
   a footprint that is fixed before any font loads, and no extra request in the header.

The rendered raster assets **are** used, copied into Next's file-convention slots rather
than served from here, so Next fingerprints them and emits the right `<link>` and `<meta>`:

| Delivered here | Copied to | Serves |
| --- | --- | --- |
| `favicon-32.png` | `src/app/icon.png` | `<link rel="icon" sizes="32x32">` |
| `favicon-16.png` | `src/app/icon1.png` | `<link rel="icon" sizes="16x16">` |
| `apple-touch-icon-180.png` | `src/app/apple-icon.png` | `<link rel="apple-touch-icon">` |
| `og-image-1200x630.png` | `src/app/[locale]/opengraph-image.png` | `og:image` / `twitter:image` |

This folder stays the source of truth: re-export from the design file to here, then copy
across. Keep both copies in step — nothing checks that they match.

## Proportions

Anything that reserves space for the mark should use what `Logo.tsx` draws, not what the
delivered `.svg` boxes say:

|  | `Logo.tsx` | delivered `.svg` |
| --- | --- | --- |
| stacked lockup | **1.809 : 1** | 243.9 : 137.6 (1.772 : 1) |
| horizontal lockup | **5.419 : 1** | 176 : 30 (5.867 : 1) |
| compact tile | **1 : 1** | 1 : 1 |

The two boxes differ because the delivered files were laid out against slightly-off
measurements of Lexend 800: "MPH" was taken as 2.147em when it advances 2.197em, and
"MPH MEISTRID" as 4.5× the tile when it advances 4.05×. In `logo-primary.svg` the whole
shortfall lands on one side — 14.6 units of overhang on the left against 9.6 on the right,
so the artwork leans — while `logo-horizontal.svg` carries ~13 units of dead air off the end
of the wordmark. `Logo.tsx` uses the measured advances and centres the wordmark, which is
what the board-5a prototype does and what makes the overhang the 0.146× the recipe asks for
on **both** sides. Vertically the two agree: every boundary in the component lands within
0.001 of the delivered PNG.

## Type

The mark is drawn in Lexend 800 and Azeret Mono 400. **Neither family ships a Cyrillic
subset**, so neither is loaded by the site yet and `src/lib/fonts.ts` is still on Fira Sans —
see the migration note at the top of that file. The delivered artwork here is unaffected
(it is already rendered), but until the type question is settled the inline mark in
`Logo.tsx` renders its geometry in the site's current faces rather than in Lexend.
