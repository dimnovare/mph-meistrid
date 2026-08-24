# Handoff: MPH Meistrid redesign — identity, public site, admin

## Overview
Visual redesign of mph-meistrid (dimnovare/mph-meistrid, branch main): a new "5a Masonry" brand identity (graphite, Onest, brick-course motif — the black+orange Direction A is retired), a redesigned bilingual public one-pager, and a design pass over the existing admin. The admin's structure, flows and copy rules from `docs/Claude Design Prompt — MPH Meistrid Admin.md` all still hold; this changes visuals plus two additions noted below.

## About the design files
The bundled `.dc.html` files are **design references created in HTML** — prototypes showing intended look and behavior, not production code. The task is to **recreate them in the existing Next.js + Tailwind v4 codebase** using its established patterns (tokens in `src/app/globals.css`, next-intl, existing components). Open the files in a browser to inspect; `MPH Admin Design.dc.html` and `MPH Meistrid Identity.dc.html` are annotated spec boards, `MPH Website Prototype.dc.html` is a working prototype.

## Fidelity
**High-fidelity.** Colors, type, spacing and copy are final unless a token note below says otherwise. Recreate pixel-perfectly with the codebase's tokens/utilities.

## The identity (see MPH Meistrid Identity.dc.html, option 5a; board 2a for version logic)
- Wordmark: "MPH" in Onest 800, letter-spacing -0.05em, graphite `#2B2A26`.
- Beneath it the **foundation slab**: a solid bar set wider than the letters (≈14px overhang each side at 96px wordmark) containing `MEISTRID` knocked out in JetBrains Mono 400, letter-spacing .4em; under it **two brick courses** — rows of solid rectangles with 2px gaps, staggered like running bond (course flex ratios 1 / 2.2 / 2.2 / 1 and 2.2 / 2.2 / 2.2).
- Compact mark / favicon: bordered square tile, Onest-800 "M", 3-brick base course (ratios 1/2/1). Implement in `src/components/brand/Logo.tsx` + `src/app/icon.tsx`.
- Mono spec labels throughout the identity use JetBrains Mono.

## Design tokens — migration against src/app/globals.css
Keep the token architecture (contrast pairs, on-ink variant, radii, shadows, motion). Change:
- `--color-ink`: `#16130F` → **`#2B2A26`** (brand graphite; used for nav CTA, band, footer, buttons).
- **Accent family retired on the public site.** `accent / accent-hover / accent-press / accent-strong / accent-on-ink / accent-soft / on-accent` no longer appear in the new design; primary actions are ink fills with white labels (#fff on #2B2A26 = 12.6:1). Either delete usages or repoint accent → ink. `::selection` needs a new pair (suggest ink bg / white text).
- Fonts: `--font-mph-sans` → **Onest** (400/600/800); `--font-mph-display` → Onest 800 (single family site-wide). Add a mono token → **JetBrains Mono** (400/500) for eyebrows/meta/mono labels. Update `src/lib/fonts.ts`. **Why Onest/JetBrains Mono:** Lexend and Azeret Mono ship no Cyrillic at all, which blocked the RU locale; these are the closest matches with full native Cyrillic.
- Neutrals: prototype hairlines use `#ECEAE4` (between `line #DDD9D3` and `surface-2`); acceptable to snap to existing `line`. Prototype muted text `#6E6A61` ≈ existing `fg-muted #6A655E` — use the token.
- Unchanged: `danger #B4231A`, `danger-soft #FCEDEB`, `success #1B6B3F`, `success-soft #EAF3ED`, `fg #262320`, `fg-strong #14120F`, `surface #F6F5F2`, `line-strong #8B857C`, radii (`radius-panel` 8, `radius-control` 4), shadows (`shadow-bar` etc.), spacing scale, control sizes (48 public / 56 admin / 88 dashboard).

## Public site (MPH Website Prototype.dc.html → src/components/sections + layout)
One page, max-width 1200px content, 32px side padding, white page.
- **Header** (sticky, 72px, white 94% + blur, 1px line bottom): compact mark 30px + "MPH MEISTRID" Onest 800 15px; nav links Onest 600 13px (Teenused/Objektid/Protsess/Kontakt); **flag language switcher** (see below); ink CTA button "Küsi pakkumist" (13px/600, 13×18px padding, square corners).
- **Hero** (grid 1.05fr/1fr, gap 64px, padding 84/96): mono kicker 11px .22em `TALLINN · HARJUMAA · ALATES 2014`; h1 Onest 800 56px/1.04 -0.035em "Ehitame ja viimistleme korralikult."; lead 16px fg-muted; ink CTA + underlined text link; 210px two-course brick divider. Right: photo at `width:100%; aspect-ratio:3/2; max-height:440px` (width-driven — do not fix the height), mono caption row.
- **Teenused**: h2 34px + mono strip right; 3-column grid, cells flush (no gaps), 1.5px ink top rule, cells padding 26px all sides w/ 26px left, 1px line bottom, hover fill `#F4F3EF`; cell = mono index 10px, name Onest 800 18px, desc 13px fg-muted.
- **Band** (ink bg, grid auto/1fr gap 80, padding 76/32): knockout masonry lockup (MPH 88px white + white slab/courses), right heading 30px white + body 14.5px `#A9A399→on-ink-muted`.
- **Objektid**: 2×2 grid, gap 44/40; card = 4:3 photo, mono meta 9.5px .16em, title 18px/800.
- **Protsess** (surface band): 4 columns, each 1.5px ink top rule, small 2-brick glyph, mono index, title 17px/800, desc 13px.
- **Kontakt** (grid 1.15fr/1fr gap 72): form fields 1.5px `#DDD9D2→line` borders, 14/15px padding, focus border ink; submit = ink button; success panel = 1.5px ink border box with brick glyph, "Päring saadetud." + personalized thanks; validation = name+contact required, error line in danger. Right rail: 1px left rule, mono labels + values (phone/email/region/hours).
- **Footer**: two brick-course strips (14px rows, 3px gaps) above ink footer; wordmark, tagline, LEHED/KONTAKT/REKVISIIDID columns (mono 10px .18em headers), bottom rule row with © and services strip.
- Anchors scroll smoothly (`scroll-padding` already handled in globals.css).

## Mobile (≤720px) — public site
Breakpoint 720px, one layer (the prototype implements it with `.m-*` utility overrides; in production use Tailwind responsive variants):
- Header: nav links + header CTA hide; a hamburger (3×22px bars, 44px hit area) appears right of the flags; tapping opens a dropdown panel under the header — 4 links (16px/600, 56px rows, hairline dividers) + full-width ink CTA; any tap closes it. Flags stay visible in the bar at all sizes.
- Hero: single column, padding 44/20/56, h1 56→36px; the photo derives its size from width (`aspect-ratio:3/2`, `max-height:440px`), never from a fixed height — a fixed height makes the slot derive width from it and overflow.
- Teenused: 3 cols → 1 col; cells drop their side padding so text aligns flush with the 20px content edge (hover fill spans the column).
- Band: stacks, lockup left-aligned above the text, gap 40; shift the lockup right by the slab overhang (13px) so the slab edge — its widest element — aligns flush with the 20px content edge.
- Objektid: 2×2 → single column, gap 36. Protsess: 4 → 1, gap 26.
- Kontakt: form stacks above the info rail; the rail swaps its left rule for a top rule (padding-top 28); name/contact field pair goes single-column.
- RU strings are longer: the hero CTA pair and the section-header rows (h2 + mono strip) must be allowed to wrap on mobile, and the mono strips drop their nowrap. Add `overflow-x:clip` on body as a safety net.
- All sections: side padding 32→20px. Footer already wraps.
- Viewport meta is set; type stays ≥13px, hit targets ≥44px.

## Language switcher — flags (both site and admin)
Replaces the text switch in `src/components/layout/LangSwitch.tsx`:
- Two buttons, Estonian + Russian **flag chips built from three stacked stripes** (no emoji, no images): EE `#0072CE / #161616 / #fff`, RU `#fff / #0039A6 / #D52B1E`; chip 24×17px (site) / 26×18px (admin) with an inset 1px rgba(27,29,31,.12) keyline so white stripes hold on white.
- Active: 2px ink border, full color. Inactive: 2px line border, opacity .55, grayscale(55%), hover restores. `aria-label` "Eesti keeles" / "По-русски". Hit area ≥44px public / ≥56px admin (pad the button, not the chip).
- **Admin also gets this switcher** in AdminHeader (left of "Logi välja") — a client-requested addition that overrides the brief's Estonian-only interface. Requires a Russian admin string set parallel to `src/content/admin-text.ts`; until it exists, ship the switcher hidden or the header ET-only.
- Public copy: full ET + RU dictionaries for every string are in the prototype's logic (`const T = {et:{…}, ru:{…}}`) — lift them into `src/i18n/messages/et.json` / `ru.json`. ET strings are approved verbatim; RU provided as draft for the same keys.

## Admin (MPH Admin Design.dc.html → src/app/admin + src/components/admin)
Mock colors are the **real tokens** (already synced to globals.css). The governing brief still applies: 360px-first single column, 56px controls, 88px dashboard actions, 18px body on fg-strong, nothing under 16px, 2px borders, radius-panel 8, no dev language, ↑/↓ not drag.
Screens in the file (referenceable ids): 1a tokens, 1b decisions, 1c–1d login states, 1e dashboard empty (designed first-run: dashed surface panel, brick glyph, one instruction), 1f project rows (title + status chip lead; meta recedes; controls = full-width 56px row: Muuda / ↑ 64px / ↓ 64px; **Kustuta removed from rows** — lives only in the edit screen), 1g edit draft + title error, 1h published + sticky bar + delete zone, 1j photo manager, 1k confirm dialog, 1l post-delete, 1m–1n prices + error screens. Sizes: 1p dashboard 768, 1q edit 768 (ET/RU fields pair up ≥640px, one shared hint, photo rows widen, controls stay 56px), 1r desktop (column max-width 900 centered, header full-width, identical stack). Remaining parts: 1s shared components (field, RU fields on quieter line-strong borders, error/success notices), 1t logout confirmation (inverted order, no danger red), 1u prices full row (ET+RU+note) + empty state, 1v saving/publishing states (spinner + present-tense verb, all else disabled) + 30-photo cap (notice + disabled add controls), 1w not-found.
Key decisions embedded (§6 of the brief): photo list stays **rows** (112px preview, cover row pinned first on surface with ink "Kaanepilt" badge); upload progress = one aggregate block (count 22px + 10px bar + "Ära sulge lehte"), failures get their own row with Proovi uuesti/Eemalda; **"Tee foto"** camera button added (56px, secondary, no `capture` on the library input — separate input with `capture="environment"`); sticky bar = ink, status line on top, primary white-on-ink, secondary outlined-white; **no undo toast** — the specific dialog (names job + photo count, cancel on top and focused, filled danger only inside the dialog, "Võta kodulehelt maha" alternative line) remains the guard.

## Interactions & behavior
- Site: smooth anchor nav; hover = background/color fades at 120ms `--ease-out`; form validation (name + contact non-empty) → inline danger line; success state swaps form for confirmation panel with reset link; language switch re-renders all strings, persists (`localStorage` in prototype — production uses next-intl locale routing per `src/i18n/routing.ts`).
- Admin: all states drawn per screen — focused field (2px border + 3px halo), submitting (spinner + "Login sisse…"), wrong credentials / rate-limited alerts (danger-soft, 3px left rule, role="alert"), unsaved-changes notice, saving, per-photo upload failure + retry, dialog focus on cancel.

## State management
Public: current locale; quote form (fields, error flag, sent + sender name). Admin: as already implemented in the repo (auth, store, use-photo-upload) — design adds no new state beyond the RU admin locale.

## Assets
All in `assets/` (rendered with real Onest 800 / JetBrains Mono 400 at brand graphite #2B2A26):
- `logo-primary.png` (dark, transparent bg) / `logo-primary-light.png` (white, transparent bg — for ink bands and photos); MEISTRID is a true knockout, so the slab shows whatever sits behind
- `logo-primary.svg`, `logo-horizontal.svg`, `logo-mark.svg` — structural sources; text kept as <text> (Onest/JetBrains Mono), **convert text to outlines** before print/vinyl use
- `logo-mark-512.png` (tile on white) / `logo-mark-ink-512.png` (inverted, for dark avatars)
- `favicon-32.png`, `favicon-16.png`, `apple-touch-icon-180.png` — replace `src/app/icon.tsx` output or serve statically
- `og-image-1200x630.png` — for `opengraph-image.tsx` (light lockup + services strip on ink)
Geometry recipe (for Logo.tsx): wordmark Onest 800, tracking -0.05em; slab overhang 0.146×font-size each side; slab row height 0.31×; MEISTRID = JetBrains Mono 400 at 0.146×, tracking .4em, knocked out; course height 0.115×, joint gaps 0.021× (min 1.5px); course ratios 1/2.2/2.2/1 and 2.2/2.2/2.2. Tile: border 0.05×size, course 0.2×, gaps 0.067×, bricks 1/2/1, M at 0.5×. **Centring:** position text by measured ink extents (canvas `actualBoundingBox*` / SVG `getBBox`), never by origin x — origin-based placement plus Onest's side bearing and the negative tracking leans the wordmark ~visibly right of the slab centre. The shipped SVGs use text-anchor="middle" with a dx of half the trailing letter-spacing.
All photos are user-supplied; the prototype uses drag-and-drop `image-slot` placeholders (`image-slot.js`, prototype-only). Phone `+372 5XXX XXXX`, `info@mphmeistrid.ee`, reg numbers `XXXXXXXX` are placeholders → real values via `src/content/site.ts` (registryCode 17317439 already set there).

## Files in this bundle
- `MPH Website Prototype.dc.html` — working public-site prototype (ET/RU, form, flags)
- `MPH Admin Design.dc.html` — admin spec board, 7 screens + states, real tokens
- `MPH Meistrid Identity.dc.html` — identity: concepts (1a–5c), brand board 2a, final direction 5a
- `assets/` — logo SVG/PNG set, favicons, apple-touch icon, OG image (see Assets)
- `image-slot.js`, `support.js` — prototype runtime helpers (not for production)
