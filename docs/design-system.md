# MPH Meistrid OÜ — Design System

Art direction, tokens and component specs for the MPH Meistrid website and admin area.
Implementation of every token in this document lives in **`src/app/globals.css`** (Tailwind CSS v4, CSS-first config).

Every contrast ratio in this document is **computed**, not estimated — WCAG 2.1 relative-luminance formula, sRGB.

---

## 1. Art direction — "Plate & Signal"

The site is a white, daylight-bright sheet on which large hard-cornered photographs of finished work are set like plates in a printed portfolio, framed by condensed industrial type and a single warm-orange signal used only where the visitor is meant to act. Nothing floats: there are no soft shadows, no rounded app corners and no gradients — surfaces are separated by rules and borders the way a drawing set separates them, so the page reads as something *built* rather than something rendered. Orange is rationed to roughly two percent of the page — a 3px rule under each section eyebrow, the active nav marker, and the call-to-action fills — which is what keeps it reading as safety signal rather than decoration. The only dark in the system is structural: the hero photograph's scrim and the ink slab that closes the page, so the eye travels from bright evidence of work down to a single black block containing the phone number. Everything moves at most 240ms and only in response to a pointer or a tap; there is no scroll choreography at all.

### Why this beats the alternatives for this specific business

| Alternative | Why it loses here |
|---|---|
| **Dark "premium contractor"** (near-black page, photos glowing out of it) | Reads architecture studio or crypto landing. It flatters *good* photography; MPH's photos are phone shots of finished bathrooms and painted walls — bright, high-key, white-walled. On a dark page those punch holes in the layout. It also fails the daylight test for the admin, which shares these tokens. |
| **Blue corporate trust** | The logo brief explicitly warns against defaulting to corporate blue. It reads insurance broker, and it is the single most template-y choice in the trades sector. |
| **Rounded card-grid SaaS** (12px radii, soft shadows, icon circles, gradient hero) | Indistinguishable from every Next.js starter, and a direct contradiction of the scope's "should feel like a good construction company, not a software startup". |
| **Video hero / scroll-animated** | Destroys Core Web Vitals, blows the €200 budget, and adds a maintenance surface a one-person company will never touch again. |

**Plate & Signal wins on three practical grounds.** It is the cheapest direction to execute well — no illustration budget, no icon set, no motion budget. It *degrades gracefully*: when a photo is mediocre, the uniform frame and ratio carry it (see §6). And it prints — the same charcoal / orange / condensed-type system goes onto a van door, a work jacket and an invoice without being redrawn, which is exactly what the logo brief asks the identity to survive.

### Recurring visual motif — the accent rule

One device repeats across the whole site so it reads as designed rather than assembled: **a 3px × 32px solid `accent` bar**, sitting directly above section eyebrows, service card titles, and the pricing disclaimer. It replaces an icon set entirely (zero assets, zero payload), it survives monochrome printing, and it is the one place orange appears outside a CTA.

---

## 2. Theme decision — **light, with three fixed dark sections**

**The site is light-themed.** There is **no** `prefers-color-scheme: dark` variant, and `color-scheme: light` is declared on `html`.

Reasoning:

1. **Trust and transaction.** Prices, the registry code, the phone number and the quote form are transactional data. People associate light backgrounds with documents, quotes and invoices. This is a business card, not an entertainment product.
2. **The daylight test — decisive.** The primary admin user is a builder holding a phone on a site, outdoors, in sun. In direct sunlight, screen reflectance swamps low-luminance pixels; a dark UI becomes close to unreadable while a high-luminance light UI stays legible. The admin shares this token set, so the public site's theme decision *is* the admin's theme decision.
3. **The photography argument cuts the other way here.** Construction photography does photograph well against dark — professional construction photography. Amateur interior phone photos are bright and slightly over-exposed; against white with a 1px inset frame they sit flat and even, against near-black they read as blown-out holes.
4. **Cost.** A second theme doubles the contrast QA surface and doubles the photo-treatment problem, for a single-page site with one administrator. Not worth it.

**Dark is used in exactly three places**, all opt-in via the `.on-ink` context class (plus the lightbox):

| Where | Why |
|---|---|
| Hero photograph scrim | The photo needs a scrim for text contrast regardless; making it deliberate turns a requirement into the page's opening statement. |
| Closing CTA band | Gives the page a hard, confident close and isolates the single most important action. |
| Footer | Continues the CTA slab, separated by a 1px `ink-line` rule — together they read as the page's foundation. |

---

## 3. Colour system

**Direction A from the logo brief — charcoal / near-black + warm construction orange.**

### Why Direction A over B and C

- **Direction B (graphite + safety yellow) is not viable as a primary accent.** Safety yellow (`#FFC400`) against white is **1.60:1** — it can never be a link, a text colour, an icon, or a thin rule. It only works as a large fill with near-black text (`#14120F` on `#FFC400` = **11.71:1**). A palette whose accent can only ever be a background is crippled on a site that needs accent links, accent rules and an accent focus state.
- **Direction C (navy + concrete grey + accent)** spends the brand's one memorable colour on a neutral. The logo brief itself warns against defaulting to corporate blue, and navy plus grey is the trades-sector template look.
- **Direction A gives a workable two-role accent.** A bright orange fill (`#E2600F`) for large elements and a darkened same-hue orange (`#B04B0C`) that clears 4.5:1 as body text on every light surface. One hue, two jobs, no compromise.

**Neutrals are warm** (hue ≈ 40°), not blue-grey slate. This is a deliberate differentiator: cold slate neutrals are the default Tailwind/SaaS palette and are exactly the look the brief forbids. Warm neutrals also sit under orange without the page going muddy.

### Compatibility with the final logo

The website palette is **token-swappable**. If the logo lands on Direction B or C, only the six `--color-accent*` tokens change; the entire neutral ramp, all component specs, and every neutral contrast pair in §3.3 stay valid. Two constraints must be honoured by any replacement accent:

- `--color-accent` must reach **≥3.0:1 against `#FFFFFF`** (it is used for UI rules and focus rings).
- `--color-on-accent` (the label on the accent fill) must reach **≥4.5:1 against `--color-accent`, `--color-accent-hover` and `--color-accent-press`**.
- A separate `--color-accent-strong` must reach **≥4.5:1 against `#FFFFFF`, `#F6F5F2` and `#ECEAE5`** for accent text.

### 3.1 Light ramp

| Token | Hex | Role |
|---|---|---|
| `--color-page` | `#FFFFFF` | Page background |
| `--color-surface` | `#F6F5F2` | Alternating band, quiet card fill |
| `--color-surface-2` | `#ECEAE5` | Input wells, hover surface, disabled fill |
| `--color-line` | `#DDD9D3` | Hairline divider — **decorative only** |
| `--color-line-strong` | `#8B857C` | Interactive component boundary (meets 3:1) |
| `--color-fg-muted` | `#6A655E` | Secondary text |
| `--color-fg` | `#262320` | Body text |
| `--color-fg-strong` | `#14120F` | Headings |

> **Two border tokens, not one.** `--color-line` is 1.41:1 on white — beautiful as a divider, illegal as the sole boundary of a control. WCAG 1.4.11 requires 3:1 for UI component boundaries, so inputs, ghost buttons and dropzones use `--color-line-strong`. Getting this wrong is the most common accessibility failure in "clean minimal" design systems.

### 3.2 Ink ramp (dark sections)

| Token | Hex | Role |
|---|---|---|
| `--color-ink` | `#16130F` | Dark band background |
| `--color-ink-raised` | `#262218` | Raised surface inside an ink band |
| `--color-ink-line` | `#716D65` | Border inside ink bands (meets 3:1 on both ink surfaces) |
| `--color-on-ink` | `#F5F3EF` | Text on ink |
| `--color-on-ink-muted` | `#B5AFA4` | Secondary text on ink |

### 3.3 Accent + status

| Token | Hex | Role |
|---|---|---|
| `--color-accent` | `#E2600F` | Rest fill, rules, focus marks, active nav bar |
| `--color-accent-hover` | `#F0721E` | Fill hover — **lighter**, so the ink label *gains* contrast |
| `--color-accent-press` | `#D45A0D` | Fill active |
| `--color-accent-strong` | `#B04B0C` | Accent as **text / link** on light surfaces |
| `--color-accent-on-ink` | `#FF8C42` | Accent as text on ink |
| `--color-accent-soft` | `#FBEDE3` | Tint block behind disclaimers and notes |
| `--color-on-accent` | `#14120F` | Label **on** an accent fill |
| `--color-danger` | `#B4231A` | Destructive (admin) |
| `--color-danger-soft` | `#FCEDEB` | Error block background |
| `--color-success` | `#1B6B3F` | Confirmation (admin) |
| `--color-success-soft` | `#EAF3ED` | Success block background |
| `--color-focus` | `#14120F` | Focus ring on light |
| `--color-focus-on-ink` | `#F5F3EF` | Focus ring on ink |

> **The accent fill takes a near-black label, never white.** White on `#E2600F` is 3.55:1 and fails AA for body-size text. Ink on `#E2600F` is 5.27:1 and passes. This is not a compromise — black-on-orange is the native visual language of construction signage, and it is the single detail that stops the CTA looking like a generic SaaS button.
>
> **Hover lightens rather than darkens.** The reflex is to darken a filled button on hover, but with a near-black label that *reduces* contrast. `#E2600F → #F0721E` moves the label from 5.27:1 to 6.35:1.

### 3.4 Contrast table — computed values

Threshold key: **AA body** ≥ 4.5:1 · **AA large / UI** ≥ 3:1 (large = ≥24px, or ≥18.66px bold) · **decorative** = no text, no boundary duty.

#### Text on light surfaces

| Foreground | Background | Ratio | Passes |
|---|---|---|---|
| `fg-strong` `#14120F` | `page` `#FFFFFF` | **18.70:1** | AA body (AAA) |
| `fg-strong` `#14120F` | `surface` `#F6F5F2` | **17.15:1** | AA body (AAA) |
| `fg` `#262320` | `page` `#FFFFFF` | **15.63:1** | AA body (AAA) |
| `fg` `#262320` | `surface` `#F6F5F2` | **14.33:1** | AA body (AAA) |
| `fg` `#262320` | `surface-2` `#ECEAE5` | **13.00:1** | AA body (AAA) |
| `fg` `#262320` | `accent-soft` `#FBEDE3` | **13.64:1** | AA body (AAA) |
| `fg-muted` `#6A655E` | `page` `#FFFFFF` | **5.78:1** | AA body |
| `fg-muted` `#6A655E` | `surface` `#F6F5F2` | **5.30:1** | AA body |
| `fg-muted` `#6A655E` | `surface-2` `#ECEAE5` | **4.80:1** | AA body |

#### Accent

| Foreground | Background | Ratio | Passes |
|---|---|---|---|
| `accent-strong` `#B04B0C` | `page` `#FFFFFF` | **5.44:1** | AA body |
| `accent-strong` `#B04B0C` | `surface` `#F6F5F2` | **4.99:1** | AA body |
| `accent-strong` `#B04B0C` | `surface-2` `#ECEAE5` | **4.53:1** | AA body |
| `accent-strong` `#B04B0C` | `accent-soft` `#FBEDE3` | **4.75:1** | AA body |
| `on-accent` `#14120F` | `accent` `#E2600F` | **5.27:1** | AA body |
| `on-accent` `#14120F` | `accent-hover` `#F0721E` | **6.35:1** | AA body |
| `on-accent` `#14120F` | `accent-press` `#D45A0D` | **4.69:1** | AA body |
| `accent` `#E2600F` | `page` `#FFFFFF` | **3.55:1** | AA large / UI only |
| `accent` `#E2600F` | `surface` `#F6F5F2` | **3.26:1** | AA large / UI only |
| ~~`white` `#FFFFFF`~~ | ~~`accent` `#E2600F`~~ | ~~3.55:1~~ | **FAILS — forbidden** |

#### Ink sections

| Foreground | Background | Ratio | Passes |
|---|---|---|---|
| `on-ink` `#F5F3EF` | `ink` `#16130F` | **16.71:1** | AA body (AAA) |
| `on-ink` `#F5F3EF` | `ink-raised` `#262218` | **14.31:1** | AA body (AAA) |
| `on-ink-muted` `#B5AFA4` | `ink` `#16130F` | **8.49:1** | AA body (AAA) |
| `on-ink-muted` `#B5AFA4` | `ink-raised` `#262218` | **7.27:1** | AA body (AAA) |
| `accent-on-ink` `#FF8C42` | `ink` `#16130F` | **8.01:1** | AA body (AAA) |
| `accent-on-ink` `#FF8C42` | `ink-raised` `#262218` | **6.86:1** | AA body |
| `white` `#FFFFFF` | `ink` `#16130F` | **18.52:1** | AA body (AAA) |
| `accent` `#E2600F` | `ink` `#16130F` | **5.21:1** | AA body |
| `accent` `#E2600F` | `ink-raised` `#262218` | **4.47:1** | AA large / UI only |

#### Borders, rules and focus (3:1 duty)

| Colour | Against | Ratio | Verdict |
|---|---|---|---|
| `line-strong` `#8B857C` | `page` `#FFFFFF` | **3.66:1** | Valid control boundary |
| `line-strong` `#8B857C` | `surface` `#F6F5F2` | **3.35:1** | Valid control boundary |
| `line-strong` `#8B857C` | `surface-2` `#ECEAE5` | **3.04:1** | Valid control boundary |
| `ink-line` `#716D65` | `ink` `#16130F` | **3.44:1** | Valid control boundary |
| `ink-line` `#716D65` | `ink-raised` `#262218` | **3.08:1** | Valid control boundary |
| `line` `#DDD9D3` | `page` `#FFFFFF` | **1.41:1** | **Decorative divider only** |
| `line` `#DDD9D3` | `surface` `#F6F5F2` | **1.29:1** | **Decorative divider only** |
| `focus` `#14120F` | `page` `#FFFFFF` | **18.70:1** | Ring valid |
| `focus` `#14120F` | `accent` `#E2600F` | **5.27:1** | Ring valid on the orange button |
| `focus` `#14120F` | `surface-2` `#ECEAE5` | **15.55:1** | Ring valid |
| `focus-on-ink` `#F5F3EF` | `ink` `#16130F` | **16.71:1** | Ring valid |

> **One focus ring for the entire product.** Ink at 3px clears 3:1 against every light surface *and* against the orange fill, so no component needs a bespoke ring — only ink bands flip it to `focus-on-ink`. This is why the focus colour is ink and not orange: an orange ring is invisible on an orange button.

#### Status (admin)

| Foreground | Background | Ratio | Passes |
|---|---|---|---|
| `white` `#FFFFFF` | `danger` `#B4231A` | **6.57:1** | AA body |
| `danger` `#B4231A` | `page` `#FFFFFF` | **6.57:1** | AA body |
| `danger` `#B4231A` | `surface` `#F6F5F2` | **6.03:1** | AA body |
| `danger` `#B4231A` | `danger-soft` `#FCEDEB` | **5.77:1** | AA body |
| `fg-strong` `#14120F` | `danger-soft` `#FCEDEB` | **16.43:1** | AA body (AAA) |
| `white` `#FFFFFF` | `success` `#1B6B3F` | **6.52:1** | AA body |
| `success` `#1B6B3F` | `page` `#FFFFFF` | **6.52:1** | AA body |
| `success` `#1B6B3F` | `success-soft` `#EAF3ED` | **5.76:1** | AA body |

#### Text over photography — scrim thresholds

Computed **worst case**: scrim composited over a pure-white photo region (a blown-out window or white wall — the realistic failure case for interior phone photos), white text on top.

| Effective scrim α over white | Composite | White text ratio |
|---|---|---|
| 0.35 | `#ADACAB` | 2.27:1 — fails |
| 0.55 | `#7F7D7B` | 4.10:1 — fails |
| **0.62** | `#6F6D6A` | **5.16:1 — minimum permitted** |
| 0.68 | `#615F5C` | 6.36:1 |
| 0.72 | `#575552` | 7.43:1 |
| 0.88 | `#322F2C` | 13.30:1 |

**Rule: effective scrim opacity must be ≥ 0.62 anywhere text sits.** See §6 for the production gradient.

---

## 4. Typography

### 4.1 The families

| Role | `next/font/google` import | Family | Weight | Subsets |
|---|---|---|---|---|
| Display / headings | `Fira_Sans_Condensed` | Fira Sans Condensed | **700** | `["latin", "latin-ext", "cyrillic"]` |
| Body / UI | `Fira_Sans` | Fira Sans | **400**, **600** | `["latin", "latin-ext", "cyrillic"]` |

**Two families. Three weight files total.** Within budget.

#### Cyrillic verification — this is where most font choices die

Both families were verified twice: against the live Google Fonts CSS API (checking that the `/* cyrillic */` subset block — `U+0301, 0400–045F, 0490–0491, 04B0–04B1, 2116` — is actually served) and against `node_modules/next/dist/compiled/@next/font/dist/google/font-data.json`, which is the exact data the `next/font` loader will use at build time.

```
Fira Sans            ["100"…"900"]  ["cyrillic","cyrillic-ext","greek","greek-ext","latin","latin-ext","vietnamese"]
Fira Sans Condensed  ["100"…"900"]  ["cyrillic","cyrillic-ext","greek","greek-ext","latin","latin-ext","vietnamese"]
```

**Faces that were checked and rejected for missing Cyrillic:**

| Face | Subsets actually served | Verdict |
|---|---|---|
| **IBM Plex Sans Condensed** | `cyrillic-ext`, `latin`, `latin-ext`, `vietnamese` | **Rejected — the trap.** It ships `cyrillic-ext` but *not* base `cyrillic`. `cyrillic-ext` contains historic and minority-language glyphs, **not** the Russian alphabet. Requesting `subsets: ["cyrillic"]` would fail the build; omitting it would silently render Russian in a fallback font. (Note: plain *IBM Plex Sans* does ship base `cyrillic` — only the Condensed cut does not.) |
| Archivo | `latin`, `latin-ext`, `vietnamese` | Rejected |
| Barlow Condensed | `latin`, `latin-ext`, `vietnamese` | Rejected |
| Poppins, Space Grotesk, DM Sans, Plus Jakarta Sans, Outfit, Figtree, Public Sans, Lexend, Bebas Neue, Work Sans | no `cyrillic` | Rejected — these are the popular geometric/neo-grotesque faces that fail this brief |

Faces that *do* ship base `cyrillic` and were considered: Oswald, Golos Text, Onest, Geologica, Commissioner, Wix Madefor Display/Text, Roboto Condensed, PT Sans Narrow, Inter Tight, Rubik, Manrope.

#### Why Fira over those

- **Condensed is load-bearing, not stylistic.** Estonian compounds are long. "siseviimistlustööd" is 18 characters; at 360px the content box is 320px. In a normal-width grotesque a 36px heading of that word measures ~356px and overflows. In Fira Sans Condensed 700 at −0.02em it measures **256px** — a 25% safety margin, with headroom up to 45px before it would touch the edge. Condensed type is the direct answer to the language.
- **Oswald was the obvious condensed choice and was rejected for being template-y** — it is on essentially every trades, gym and barber template, and the brief explicitly forbids that.
- **Lineage.** Fira was drawn by Carrois / Erik Spiekermann, who is the wayfinding-and-signage type designer (Deutsche Bahn). It reads utilitarian-European and infrastructural, not startup-neutral like Inter and not fashionable like the trendy geometrics.
- **Cyrillic quality.** Fira's Cyrillic is natively drawn, not auto-derived — it holds up in Russian at both display and text sizes.
- **Superfamily coherence.** Condensed and regular are designed against each other, so headings and body read as one voice. On a photography-led page the type should be a quiet structural frame, not a second personality competing with the photos.

#### Language notes that constrain the scale

- **Do not set h1/h2 in uppercase.** Uppercase Cyrillic is the binding constraint: a 16-character Russian word set uppercase in condensed bold needs ~9.3em, which caps the heading at ~34px at 360px and removes all headroom. Headings are **sentence case**. Uppercase is reserved for short eyebrow/kicker labels ("TEENUSED" / "УСЛУГИ") and form labels.
- **Never apply negative letter-spacing to body text.** Cyrillic has more vertical strokes per word than Latin; tightening closes the counters. Negative tracking appears only at display sizes ≥28px where it is optically necessary.
- **Russian runs ~8% wider than Estonian at the same size.** Line-length limits (`--container-copy`) are set from the Cyrillic measure, not the Latin one.
- `hyphens: auto` is applied to headings and depends on `lang` being set correctly on `<html>` by `next-intl`; `overflow-wrap: break-word` is the guaranteed fallback.

### 4.2 Type scale

Fluid between **360px and 1280px** viewport. All values verified at 360 / 390 / 768 / 1024 / 1280px.

| Step | `clamp()` | 360px | 768px | 1280px | Line-height | Letter-spacing | Weight | Family |
|---|---|---|---|---|---|---|---|---|
| **h1** | `clamp(2.25rem, 1.3696rem + 3.913vw, 4.5rem)` | 36px | 52px | 72px | 1.04 | −0.02em | 700 | display |
| **h2** | `clamp(1.75rem, 1.3587rem + 1.7391vw, 2.75rem)` | 28px | 35px | 44px | 1.10 | −0.015em | 700 | display |
| **h3** | `clamp(1.3125rem, 1.1413rem + 0.7609vw, 1.75rem)` | 21px | 24px | 28px | 1.20 | −0.01em | 700 | display |
| **lead** | `clamp(1.125rem, 1.0272rem + 0.4348vw, 1.375rem)` | 18px | 20px | 22px | 1.45 | −0.005em | 400 | sans |
| **body** | `clamp(1rem, 0.9755rem + 0.1087vw, 1.0625rem)` | 16px | 16.4px | 17px | 1.60 | 0 | 400 | sans |
| **small** | `clamp(0.875rem, 0.8505rem + 0.1087vw, 0.9375rem)` | 14px | 14.4px | 15px | 1.50 | 0 | 400 | sans |
| **label** | `clamp(0.8125rem, 0.788rem + 0.1087vw, 0.875rem)` | 13px | 13.4px | 14px | 1.20 | **+0.08em** | 600 | sans, uppercase |

Notes:

- **Body floor is 16px.** Below 16px iOS Safari auto-zooms the viewport on input focus. This is non-negotiable for any input, and applied to body text for consistency.
- **Body line-height is 1.60**, deliberately generous. Estonian and Russian both produce long words and long lines; 1.5 feels cramped in both.
- The `--text-*` namespace is **reset** in `globals.css`, so `text-xs` … `text-9xl` no longer exist. The seven names above are the entire scale. This is intentional — it prevents off-scale sizes leaking into the build.
- Each `--text-*` token carries its own `--line-height`, `--letter-spacing` and `--font-weight`, so `class="text-h2"` sets all four properties at once.
- The `text-h*` utilities do **not** set the family. Semantic `h1`–`h4` elements get `font-display` from the base layer automatically; if a `text-h3` is applied to a non-heading element, add `font-display` explicitly.

### 4.3 Wiring (`src/app/layout.tsx`)

> **Not applied by this deliverable** — only `docs/design-system.md` and `src/app/globals.css` were written. This is the exact change required, and it currently still loads Geist.

```ts
import { Fira_Sans, Fira_Sans_Condensed } from "next/font/google";

const sans = Fira_Sans({
  variable: "--font-mph-sans",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "600"],
  display: "swap",
});

const display = Fira_Sans_Condensed({
  variable: "--font-mph-display",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["700"],
  display: "swap",
});

// <html lang={locale} className={`${sans.variable} ${display.variable} h-full antialiased`}>
```

- The CSS variable names **must** be `--font-mph-sans` and `--font-mph-display`; `globals.css` binds `--font-sans` and `--font-display` to them.
- `display: "swap"` avoids invisible text (FOIT). `next/font`'s default `adjustFontFallback` generates a size-adjusted local fallback, which keeps the swap from causing layout shift — leave it on.
- Fonts are self-hosted by `next/font` at build time. **No request ever leaves for fonts.googleapis.com**, which is both the performance and the GDPR position.
- Do **not** add `preload` hints manually; `next/font` handles preloading for the fonts used on the route.

---

## 5. Space, containers, rhythm, radii, borders, shadows

### 5.1 Spacing scale

Base unit **4px** (`--spacing: 0.25rem`), so the full Tailwind dynamic scale (`p-2` = 8px, `gap-6` = 24px …) is available. Use multiples of 4; prefer 8 for component padding and 16/24/32 for grouping.

Named layout tokens:

| Token | Value | 360px | 1280px+ | Use |
|---|---|---|---|---|
| `--spacing-gutter` | `clamp(1.25rem, 0.1739rem + 4.7826vw, 4rem)` | 20px | 64px | Horizontal page inset |
| `--spacing-section` | `clamp(4.5rem, 3rem + 6.6667vw, 9rem)` | 72px | 144px (at 1440) | Major section vertical padding |
| `--spacing-section-sm` | `clamp(3rem, 2.1667rem + 3.7037vw, 5.5rem)` | 48px | 88px (at 1440) | Minor section vertical padding |
| `--spacing-block` | `clamp(2rem, 1.413rem + 2.6087vw, 3.5rem)` | 32px | 56px | Gap between heading block and content |
| `--spacing-header` | `4rem` | 64px | — | Header height, mobile |
| `--spacing-header-lg` | `5rem` | — | 80px | Header height, ≥1024px |
| `--spacing-callbar` | `4rem` | 64px | — | Mobile sticky call bar height |
| `--spacing-tap` | `2.75rem` | 44px | 44px | **Absolute minimum touch target** |
| `--spacing-control` | `3rem` | 48px | 48px | Public buttons and inputs |
| `--spacing-control-lg` | `3.5rem` | 56px | 56px | Admin controls |
| `--spacing-control-xl` | `5.5rem` | 88px | 88px | Admin dashboard primary actions |

### 5.2 Section rhythm

| Breakpoint | Section padding (top/bottom) | Gutter |
|---|---|---|
| 360px | 72px | 20px |
| 390px | 74px | 21px |
| 768px (tablet) | 99px | 40px |
| 1024px (desktop) | 116px | 52px |
| 1280px | 133px | 64px |
| 1440px+ | 144px | 64px |

Alternating bands: `page` → `surface` → `page` → `surface` … Never two adjacent bands of the same tone; the tonal change *is* the section divider, so no horizontal rules between sections.

### 5.3 Containers

| Token | Value | Use |
|---|---|---|
| `--container-page` | `80rem` (1280px) | Default content frame |
| `--container-wide` | `90rem` (1440px) | Project grids, full-bleed photo bands |
| `--container-copy` | `38rem` (608px) | Running text — ~71 Latin / ~68 Cyrillic chars per line at 17px |
| `--container-form` | `34rem` (544px) | Single-column forms |

`--container-*` is reset, so `max-w-md` etc. no longer exist. Extra breakpoint `--breakpoint-xs: 35rem` (560px) marks where the mobile edge-to-edge project column becomes a 2-up grid.

### 5.4 Radii — near-square

| Token | Value | Applied to |
|---|---|---|
| `--radius-none` | `0` | **All photography**, project cards, hero, image containers |
| `--radius-chip` | `2px` | Badges, status pills |
| `--radius-control` | `4px` | Buttons, inputs, service cards, note blocks |
| `--radius-panel` | `8px` | Admin controls, dialogs, upload dropzone |

Rounded corners read "app"; hard corners read "built". Photography is **never** rounded — a square-cornered 4:3 photo looks like a printed portfolio plate, a rounded one looks like a social card. The admin gets the larger 8px radius because bigger, softer targets are easier to hit and read as more forgiving.

### 5.5 Border widths

| Width | Use |
|---|---|
| **1px** | Decorative dividers (`line`), card outlines, table rows, photo inset frame |
| **2px** | Interactive boundaries: secondary/ghost button borders, input borders in error state, admin borders (visible in daylight glare) |
| **3px** | The accent rule motif; active nav indicator; the left rule on note/error/success blocks; the focus ring |

### 5.6 Shadows — four, all warm

Cards use **borders, not elevation**. Shadows are tinted from the ink (`rgb(20 18 15 / …)`), never pure black.

| Token | Value | Use |
|---|---|---|
| `--shadow-edge` | `inset 0 -2px 0 rgb(20 18 15 / 0.14)` | The physical "lip" on filled buttons — reads as a pressed metal plate, removed on `:active` |
| `--shadow-frame` | `inset 0 0 0 1px rgb(20 18 15 / 0.08)` | Hairline **inside** every project photo |
| `--shadow-raise` | `0 1px 2px rgb(20 18 15 / 0.06)` | Sticky header, once scrolled |
| `--shadow-bar` | `0 -2px 12px rgb(20 18 15 / 0.18)` | Mobile call bar, cast upward |
| `--shadow-overlay` | `0 12px 32px rgb(20 18 15 / 0.16)` | Dialogs, lightbox chrome |

### 5.7 z-index scale

| Layer | z |
|---|---|
| In-page sticky (admin action bar) | 10 |
| Mobile call bar | 30 |
| Site header | 40 |
| Mobile menu panel | 50 |
| Dialog / lightbox | 60 |
| Skip link, toasts | 100 |

Native `<dialog>` renders in the browser top layer and sits above all of these regardless of `z-index` — the 60 entry is for the non-dialog fallback path only.

---

## 6. Photography direction

Photography carries this design. Everything else is a frame around it.

### 6.1 Ratios and cropping

| Slot | Ratio | Fit |
|---|---|---|
| Project cover (card + grid) | **4:3** (`--aspect-cover`) | `object-fit: cover`, `object-position: 50% 50%` |
| Gallery thumbnails | **4:3** | `cover` |
| Lightbox / full view | **native** | `object-fit: contain` — never crop the image the user asked to see |
| Optional wide feature plate | **3:2** (`--aspect-wide`) | `cover` |
| Hero | none — `min-height` + `cover` | `cover`, `object-position: 50% 45%` |

**Why 4:3 and not 16:9 or 1:1.** 4:3 is the native sensor ratio of a phone camera, so a cover crop discards nothing. 16:9 decapitates rooms — it cuts ceilings and the top of tiling, which is exactly the workmanship being sold. 1:1 throws away the horizontal information that makes a room legible. Uniform ratio across every card is the single largest contributor to a grid looking professional.

### 6.2 Text over photography

Text appears over a photo in **exactly one place: the hero.** Project cards put their caption below the image on a solid background. This is deliberate — captions over uncontrolled amateur photos are a contrast lottery, and losing that lottery is a legal accessibility failure, not a stylistic one.

Production scrim (single gradient, on a `::after` over the image — never baked into the file, so the same photo is reusable):

```css
background-image: linear-gradient(
  to top,
  rgb(22 19 15 / 0.88) 0%,
  rgb(22 19 15 / 0.70) 45%,
  rgb(22 19 15 / 0.34) 75%,
  rgb(22 19 15 / 0.18) 100%
);
```

Hero text occupies the bottom 0–45% of the image, where scrim α ≥ 0.70 → **≥ 6.9:1** for white text even over a pure-white photo region. The floor established in §3.4 is 0.62 / 5.16:1; this sits comfortably above it.

### 6.3 What makes a good cover shot

Brief for the client, to be repeated as help text in the admin:

- **Finished work only.** No tools, no materials, no people, no protective sheeting.
- **Wide, from a corner, at chest height.** Corner angles make a room readable; doorway shots flatten it.
- **Daylight, all lights on.** Shoot mid-morning or mid-afternoon; avoid direct sun through a window in frame.
- **Horizontal (landscape) orientation for covers.** Portrait shots belong in the gallery, not the cover slot.
- **Keep verticals vertical.** Door frames and tile lines leaning is the number-one tell of an amateur photo.
- **Wipe the lens.** Site dust on a phone lens produces the haze that makes photos look cheap.
- **One clear subject per photo** — the bathroom, the wall, the floor. Not "the whole flat".

### 6.4 Making amateur phone photos look professional in a grid

This is the highest-leverage part of the whole system. In priority order:

1. **Uniform aspect ratio, uniform gap, strict grid.** No masonry. Uneven heights read as "collected" — a strict grid reads as "curated". This alone does more than any editing.
2. **`--shadow-frame`: a 1px inset hairline inside every photo.** Interior photos are mostly white walls; without an inner frame a pale photo bleeds into a white page and the grid dissolves. This is the single most effective trick and costs nothing.
3. **No CSS filters. No global desaturation, no duotone, no "unified" grade.** It looks fake, it hides the workmanship being sold, and it ages badly. Cohesion comes from the frame, not from the pixels.
4. **Server-side normalisation with `sharp`** (already a dependency):
   - **Auto-rotate from EXIF orientation first.** Phone photos arrive sideways; this is the most common "broken site" report.
   - **Strip all EXIF after rotating.** Phone photos of customers' homes carry GPS coordinates. Publishing those is a privacy incident.
   - Resize to a fixed set of widths (e.g. 480 / 768 / 1200 / 1800), serve WebP/AVIF at quality 78–82.
   - Reject or warn on uploads under ~1200px on the long edge.
5. **Curation beats editing.** Six photos where two are strong reads better than twelve where all are average. The admin should nudge toward fewer, better photos, and the cover slot should be an explicit, deliberate choice (see §9).
6. **Order the grid by quality, not by date.** The strongest cover goes first; the first row is what a visitor judges the company on.
7. **Always reserve the box.** `aspect-ratio` on the container plus `width`/`height` on `next/image` — zero CLS. Below the fold, `loading="lazy"`; the hero is `priority` + `fetchPriority="high"` and is the LCP element.
8. **Placeholder while loading** is a flat `surface-2` block, not a shimmer. Shimmer is a SaaS tell.

---

## 7. Component specifications

Global rules: minimum touch target **44 × 44px** everywhere; public controls are **48px**; focus is always `outline: 3px solid var(--color-focus); outline-offset: 2px` (1px offset on inputs), flipped to `focus-on-ink` inside `.on-ink`. **Disabled states never use `opacity`** — they use explicit tokens, because opacity produces unpredictable, usually failing, contrast.

### 7.1 Header

Sticky, `position: sticky; top: 0; z-index: 40`. **Height never changes on scroll** — shrinking headers cause reflow, jank, and break `scroll-padding-top`. The only scroll behaviour is a shadow.

| Property | Mobile (<1024px) | Desktop (≥1024px) |
|---|---|---|
| Height | 64px (`--spacing-header`) | 80px (`--spacing-header-lg`) |
| Background | `page` | `page` |
| Bottom border | 1px `line` | 1px `line` |
| Horizontal padding | `--spacing-gutter` | `--spacing-gutter` |
| Scrolled state | + `--shadow-raise` | + `--shadow-raise` |

Scrolled state is toggled by an `IntersectionObserver` on a 1px sentinel placed above the header — **no scroll event listener**, no layout reads per frame.

**Three layout tiers** (the naive two-tier version overflows at 1024px — verified by measurement):

| Tier | Contents |
|---|---|
| **< 1024px** | Logo · spacer · phone icon button (44×44) · menu button (44×44), 8px gap |
| **1024–1279px** | Logo · nav (20px gaps) · language toggle · phone **icon only** (44×44) · primary CTA. Measured ≈874px inside 920px of content width. |
| **≥ 1280px** | Logo · nav (32px gaps) · language toggle · phone with number text · primary CTA. Measured ≈1048px inside 1152px. |

**Nav items** (Teenused · Tehtud tööd · Hinnad · Meist · Kontakt): `font-sans` 600, 15px, colour `fg`.

| State | Treatment |
|---|---|
| Rest | `fg`, no marker |
| Hover | `fg-strong`, 3px `line-strong` bar at the header's bottom edge |
| Active / current section | `fg-strong`, 3px **`accent`** bar at the header's bottom edge, `aria-current="true"` |
| Focus-visible | Ink ring, 2px offset |

**Language toggle** ET / RU: two 44px-high text targets, current one `fg-strong` + 2px `accent` underline + `aria-current="true"`; the other `fg-muted`.

**Mobile menu**: full-screen panel, not a slide-out drawer — a full-screen panel gives thumb-sized targets and is far simpler to build correctly. `position: fixed; inset: var(--spacing-header) 0 0 0; overflow-y: auto; background: page; z-index: 50`. Rows 56px tall, 20px `font-sans` 600, 1px `line` bottom border, full-width tap area. Menu button becomes an X. Requirements: focus trapped inside, `Esc` closes, `body` gets `overflow: hidden`, focus returns to the menu button on close, call bar set `inert`. Bottom of panel: full-width primary CTA + full-width secondary phone button, 12px gap, plus the language toggle.

### 7.2 Hero

- Full-bleed image, `next/image` with `fill`, `sizes="100vw"`, `priority`, `fetchPriority="high"`, quality 80.
- Scrim per §6.2. Content wrapped in `.on-ink`.
- **Mobile**: `min-height: max(520px, 78svh)` (`svh`, not `vh` — `vh` is wrong under mobile browser chrome). Content bottom-aligned. `padding-bottom: calc(var(--spacing-callbar) + env(safe-area-inset-bottom) + 1.5rem)` so the call bar never covers the CTA.
- **Desktop**: `min-height: clamp(560px, 72svh, 760px)`, content left-aligned within `--container-page`.
- Content order: eyebrow label (`text-label`, uppercase, `accent-on-ink`, preceded by the 3px accent rule) → **h1** (`on-ink`) → lead paragraph (`on-ink-muted`, `max-w-copy`) → button row (primary + secondary, 12px gap; full-width stacked below 480px) → trust line (`text-small`, `on-ink-muted`: company name, registry code 17317439, service region).
- No parallax. No Ken Burns. No video. The image is static.

### 7.3 Service card

Not a floating card — a bordered block.

| Property | Mobile | Desktop |
|---|---|---|
| Padding | 24px | 32px |
| Background | `page` | `page` |
| Border | 1px `line` | 1px `line` |
| Radius | `--radius-control` (4px) | same |
| Grid | 1 column | 2 cols ≥640px · 3 cols ≥1024px |
| Gap | 16px | 24px |

Structure: **3px × 32px `accent` bar** → 16px → title (`text-h3`, `font-display`) → 8px → description (`text-small`, `fg-muted`, max 2–3 lines).

States (only if the card is a link — services are informational by default): hover → border becomes `line-strong`, accent bar scales `scaleX(1.5)` (32→48px) over 160ms `ease-out`, `transform-origin: left`. Focus-visible → ink ring on the card. Active → bar returns to 32px. Disabled: n/a.

### 7.4 Project card

The hero of the page. Entire card is one `<a href="/tood/[slug]">`.

- Image container: `aspect-cover` (4:3), `radius-none`, `overflow: hidden`, `box-shadow: var(--shadow-frame)`.
- Caption block below image: 16px top padding — title (`font-display` 700, 19–20px, `fg-strong`), 4px, location (`text-small`, `fg-muted`).
- **Grid**: below 560px — **1 column, edge-to-edge** (negative margin cancels the gutter, caption indented back to the gutter). This gives phone photos maximum size and reads like a portfolio rather than a template. 560–1023px — 2 columns, 20px gap. ≥1024px — 3 columns, 24px gap, inside `--container-wide`.

| State | Treatment |
|---|---|
| Rest | as above |
| Hover (`@media (hover: hover)` only) | image `transform: scale(1.03)`, 240ms `ease-out`; title → `accent-strong` |
| Focus-visible | Ink ring around the whole card, 3px offset |
| Active | image `scale(1.01)`, 120ms |
| Disabled | n/a |

This image scale is **the only transform on the public site.**

### 7.5 Image gallery + lightbox

Recommended architecture: cards link to server-rendered `/tood/[slug]` pages (SEO), and the lightbox operates on the gallery *within* that page. Cover images then have real URLs, real alt text and real indexability.

Built on native **`<dialog>`** — free focus trap, free `Esc`, free top-layer stacking, free `::backdrop`, and roughly 20 lines of client JS instead of a library.

- Backdrop: `rgb(20 18 15 / 0.92)`.
- Image: `object-fit: contain`, `max-height: calc(100dvh - 8rem)`, `max-width: min(100vw - 2rem, 1600px)`.
- **Close**: 48×48 button, top-right, 16px inset. White glyph on `rgb(255 255 255 / 0.12)` with 1px `rgb(255 255 255 / 0.28)` border. `aria-label="Sulge"`.
- **Prev / next** (≥768px): 56×56, vertically centred, 16px from edges, same chrome. `aria-label="Eelmine pilt" / "Järgmine pilt"`.
- **Counter**: bottom-centre, `font-sans` 600, 14px, `on-ink-muted`, `tabular-nums` — "3 / 12".
- **Mobile (<768px)**: prev/next buttons hidden; horizontal swipe plus a 56px-tall thumbnail strip along the bottom, `overflow-x: auto`, `scroll-snap-type: x mandatory`, each thumb 56×56 with a 2px `accent` border on the current item.
- **Keyboard**: `←` / `→` navigate, `Esc` closes, `Home` / `End` jump to first / last. Focus returns to the triggering thumbnail on close.
- Only the adjacent (prev/next) images are preloaded.
- Motion: backdrop fades 180ms; image crossfades 120ms. No zoom-in flourish.

### 7.6 Pricing table row

Not an HTML `<table>` on mobile — a `<dl>` rendered as a two-column grid, which reflows correctly and reads properly to screen readers.

- `display: grid; grid-template-columns: 1fr auto; align-items: baseline;`
- Padding `16px 0` mobile / `20px 0` desktop. 1px `line` bottom border; last row none.
- **Left**: service name, `font-sans` 600, 17px, `fg-strong`. Optional note beneath: `text-small`, `fg-muted`, 4px top margin.
- **Right**: price, `font-display` 700, 19px mobile / 21px desktop, `fg-strong`, `font-variant-numeric: tabular-nums`, `white-space: nowrap`. Unit in `fg-muted` `text-small`.
- **≥768px only**: a dotted leader between name and price — a flexing `<span aria-hidden="true">` with `border-bottom: 1px dotted var(--color-line-strong)`, 8px margin each side, `align-self: baseline`. This is the printed-quotation reference and is the detail that makes the pricing section feel like it came from a builder rather than a template. Suppressed below 768px where there is no room.
- Row hover: background `surface`, 120ms. Rows are not interactive otherwise.
- **Disclaimer block** below the list: `accent-soft` background, 3px left `accent` rule, padding `16px 20px`, `text-small`, `fg` (13.64:1). Text: exact price depends on scope and is confirmed in the final quotation.

### 7.7 Contact block

Light section on `surface`. Two columns ≥900px (details left, form right), stacked below.

- **Detail rows**: `min-height: 44px`, 20px icon + text, 16px gap, 12px vertical padding, 1px `line` between rows.
- **Phone**: `<a href="tel:…">`, `font-sans` 600, 18px, `fg-strong`, `tabular-nums`. `text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 2px; text-decoration-color: var(--color-line-strong)` → `accent` on hover.
- **Email**: `<a href="mailto:…">`, same treatment. Add `overflow-wrap: anywhere` — long addresses overflow at 360px.
- **Company block**: `MPH Meistrid OÜ`, `Registrikood 17317439` in `text-small` / `fg-muted` / `tabular-nums`.
- Form spec in §7.10; container `--container-form`.

### 7.8 Footer

`.on-ink`, background `ink`. Sits directly under the closing CTA band, separated by a 1px `ink-line` rule.

- Padding: 56px top / 32px bottom mobile; 80px / 40px desktop. On mobile, `body` already reserves the call bar height, so no extra bottom padding is needed here.
- **Desktop**: three columns — logo + one-line description (left), nav repeat (centre), contacts (right).
- **Mobile**: stacked, 32px between groups.
- Links: `on-ink-muted` → `on-ink` on hover, 120ms. Minimum 44px row height.
- **Bottom bar**: 1px `ink-line` top border, 24px padding, `text-small`, `on-ink-muted`: `MPH Meistrid OÜ · Registrikood 17317439 · © {year}`. Language toggle repeated here.

### 7.9 Buttons

All: `font-sans` 600, 16px, `letter-spacing: 0.01em`, `--radius-control` (4px), height **48px** (`--spacing-control`), horizontal padding 24px, `transition: background-color 120ms var(--ease-out), border-color 120ms var(--ease-out), color 120ms var(--ease-out)`. Full-width below 480px inside hero and forms; auto width above.

**Primary**

| State | Background | Text | Extra |
|---|---|---|---|
| Rest | `accent` `#E2600F` | `on-accent` `#14120F` (5.27:1) | `--shadow-edge` |
| Hover | `accent-hover` `#F0721E` | `#14120F` (6.35:1) | — |
| Active | `accent-press` `#D45A0D` | `#14120F` (4.69:1) | shadow removed, `translateY(1px)` |
| Focus-visible | rest | rest | ink ring, 2px offset (5.27:1 against the fill) |
| Disabled | `surface-2` `#ECEAE5` | `fg-muted` `#6A655E` (4.80:1) | no shadow, `cursor: not-allowed`, `aria-disabled` |

**Secondary**

| State | Background | Border | Text |
|---|---|---|---|
| Rest | `page` | 2px `fg-strong` | `fg-strong` (18.70:1) |
| Hover | `surface-2` | 2px `fg-strong` | `fg-strong` |
| Active | `line` | 2px `fg-strong` | `fg-strong` |
| Focus-visible | rest | rest | ink ring |
| Disabled | `page` | 2px `line` | `fg-muted` |

On ink: border 2px `on-ink`, text `on-ink` (16.71:1), hover background `rgb(245 243 239 / 0.10)`.

**Ghost** — tertiary only ("Vaata kõiki töid →"). No background, no border. Height 44px, horizontal padding 12px, text `fg-strong`. Hover: `text-decoration: underline; text-underline-offset: 4px; text-decoration-thickness: 2px; text-decoration-color: var(--color-accent)`. Active: text `accent-strong` (5.44:1). Focus-visible: ink ring. Disabled: `fg-muted`, no underline.

### 7.10 Form field

- **Label always visible above the input** — never placeholder-as-label. `text-label` (uppercase, +0.08em) or `font-sans` 600 14px sentence case for longer labels; colour `fg-strong`; 6px bottom margin. Required marker ` *` in `accent-strong` plus `aria-required="true"`.
- **Input**: height 48px (`--spacing-control`), padding `0 14px`, **font-size 16px minimum** (iOS zoom), background `page`, border **1px `line-strong`** (3.66:1 — this is why the decorative `line` token cannot be used here), radius 4px.
- **Textarea**: `min-height: 132px`, padding `12px 14px`, `resize: vertical`.
- **Helper text**: `text-small`, `fg-muted`, 6px top margin, linked with `aria-describedby`.

| State | Treatment |
|---|---|
| Rest | 1px `line-strong` |
| Hover | border → `fg-strong` |
| Focus-visible | border → `fg-strong`, ink ring 3px at 1px offset |
| Error | border **2px `danger`**, message below in `danger` `text-small` with a 16px warning glyph, `role="alert"`, `aria-invalid="true"`, `aria-describedby`. **Field background stays white** — tinting the field red hurts readability of the value the user must fix. |
| Disabled | background `surface-2`, border 1px `line`, text `fg-muted`, `cursor: not-allowed` |

- Validate on **blur**, not on keystroke. On submit failure, move focus to the first invalid field.
- Semantic types so the right mobile keyboard appears: `type="tel" inputmode="tel" autocomplete="tel"`, `type="email" inputmode="email" autocomplete="email"`, `autocomplete="name"`.

### 7.11 Mobile sticky call bar

Rendered only below 1024px. Plain `<a>` elements — **zero JavaScript**.

- `position: fixed; inset-inline: 0; bottom: 0; z-index: 30`.
- Height 64px (`--spacing-callbar`) plus `padding-bottom: env(safe-area-inset-bottom)`.
- Background `ink`, 1px `ink-line` top border, `--shadow-bar`.
- Contents: `display: flex; gap: 8px; padding: 8px 12px`. Two equal `flex: 1` buttons, each 48px tall:
  - **"Helista"** — `href="tel:…"`, background `accent`, text `on-accent` (5.27:1), phone glyph. The phone is the money action on a trades site, so it takes the filled treatment.
  - **"Küsi pakkumist"** — anchor to the contact section, transparent background, 2px `on-ink` border, text `on-ink` (16.71:1).
- **Always visible.** No hide-on-scroll: hiding costs the user the primary action and adds JS for nothing.
- `body` reserves the height (already in `globals.css`), so the footer is never covered.
- Set `inert` while the mobile menu or lightbox is open.

---

## 8. Logo slot — reserving space for the real SVG

The logo is designed separately. The contract below lets a placeholder be swapped for the final SVG with **zero layout shift**.

### The one constraint the logo designer must honour

**Fix the aspect ratios now:**

- **Horizontal lockup (MPH + MEISTRID): 5 : 1**
- **Compact mark (MPH): 1 : 1**

Every slot below is sized from those ratios. If the final lockup is a different ratio the header will shift when it lands, so this must be specified to the identity work up front.

### Slots

| Slot | Height | Width (at 5:1) | Clear space | Notes |
|---|---|---|---|---|
| Header, ≥1024px | 32px | 160px | 16px all sides (0.5 × height) | Vertically centred in the 80px header |
| Header, <1024px | 26px | 130px | 13px all sides | Vertically centred in the 64px header |
| Footer | 28px | 140px | 14px all sides | **Light version** on ink |
| Compact mark fallback | 32 × 32px | — | 16px | See below |

**At 360px** the mobile header measures: 20 (gutter) + 130 (logo) + flexible spacer + 44 (phone) + 8 + 44 (menu) + 20 (gutter) = **266px of fixed content in 360px** — 94px of slack. Comfortable, and it stays comfortable if the logo grows to 160px wide.

**Below 400px**, or any time the lockup would need to exceed 160px, the component swaps to the **compact 1:1 mark at 32 × 32px**. Planning this swap now means the identity work knows a square mark is required, not optional.

### Implementation contract

```
.logo {
  display: block;
  height: var(--logo-h);     /* 32px / 26px / 28px per slot */
  width: auto;
  aspect-ratio: 5 / 1;       /* reserves the box before the SVG paints */
}
```

The final SVG must: carry a `viewBox` and **no** fixed `width`/`height` attributes; use `preserveAspectRatio="xMinYMid meet"`; and provide a monochrome variant using `fill="currentColor"` so the footer/light version needs no separate file. Inline the SVG in the React component rather than using `<img>` — it avoids a request, allows `currentColor`, and cannot flash.

---

## 9. Admin UI direction

**Design target:** a builder who is not comfortable with computers, standing on a site, holding a 360px phone in one hand, in daylight, wanting to add today's job in under a minute.

The admin uses **the same tokens** and is deliberately **plainer and larger** than the public site. It is not a smaller, denser version of the marketing page — it is the opposite.

### Hard minimums

| Property | Value | vs. public site |
|---|---|---|
| Button height | **56px** (`--spacing-control-lg`) | 48px |
| Dashboard primary action height | **88px** (`--spacing-control-xl`) | — |
| Input height | **56px** | 48px |
| Base body font | **18px** | 16–17px |
| Label font | **16px**, weight 600 | 14px |
| Heading font | `font-display` 700, 24–28px | fluid to 72px |
| Minimum touch target | **56 × 56px** | 44 × 44px |
| Minimum gap between targets | **12px** | 8px |
| Border width | **2px** `line-strong` | 1px `line` |
| Radius | `--radius-panel` (8px) | 4px |
| **Smallest text anywhere** | **16px** | 13px |

### Contrast policy — stricter than the public site

Body text in the admin uses `fg-strong` (**18.70:1**, AAA), not `fg`. `fg-muted` (5.78:1, AA only) is permitted **only** for non-essential helper lines and never for a value the user must read to make a decision. This is the daylight-glare allowance.

### Layout and language

- **One column up to 900px.** No sidebar, no tabs, no drawers, no accordions. Scrolling is free; navigating is not.
- **No icon-only buttons** anywhere except the photo-remove ✕. Every action carries a plain Estonian text label: "Lisa uus töö", "Salvesta", "Kustuta töö", "Määra kaanepildiks".
- **No developer terminology.** No "slug", "publish state", "metadata", "CDN". "Avaldatud" / "Mustand".
- White panels on a `surface` page background, with **2px `line-strong` borders** — 1px hairlines disappear in sunlight.
- **Sticky bottom action bar** on every form (`z-index: 10`, 64px + safe area, `ink` background, `--shadow-bar`) holding the single primary action ("Salvesta" / "Avalda töö"). This keeps the primary action permanently inside the bottom third of the screen — the one-handed reachable zone.

### Dashboard

Two stacked blocks, full width, 88px tall, 16px gap, 20px text:

1. **`+ Lisa uus töö`** — primary fill (`accent` / `on-accent`).
2. **`Muuda hindu`** — secondary (2px `fg-strong` border).

Below: "Tehtud tööd" list — one row per project, each with a 72 × 54px (4:3) thumbnail, title at 18px 600, a status chip, and "Muuda" / "Kustuta" buttons. Rows are ≥88px tall.

**Status chip**: `--radius-chip`, 8px×4px padding, 16px text — never colour alone. "Avaldatud" = `success` text on `success-soft` (5.76:1) with a filled dot; "Mustand" = `fg-muted` on `surface-2` (4.80:1) with a hollow dot.

### Photo upload

- **Dropzone**: `min-height: 180px`, 2px **dashed** `line-strong`, `--radius-panel`, background `surface`. The entire zone is a `<label>` wrapping `<input type="file" accept="image/*" multiple>`, so a tap anywhere opens the picker. A separate 56px **"Tee foto"** button uses `capture="environment"` for the camera.
- **Thumbnails**: 3-column grid on mobile (~100px each), 1:1, 8px gap. Remove ✕ is 44 × 44px, white glyph on `rgb(20 18 15 / 0.72)`, top-right. The cover carries a "Kaanepilt" badge.
- **Reordering uses explicit ↑ / ↓ buttons (44 × 44px), not drag-and-drop.** Drag on touch is unreliable, undiscoverable, and hostile to the target user. A "Määra kaanepildiks" button on each thumbnail sets the cover directly, rather than requiring a drag to position one.
- **Progress**: 6px bar, `accent` fill on a `surface-2` track, **plus a text count** ("Laadin üles 3 / 8") — a bar alone is not readable at a glance in sun.

### Destructive actions — visual language

The rule: **red never sits in a resting position where a thumb might land on it.**

1. **Delete is never the primary action and never a filled red button at rest.** At rest it is a *secondary* button: white background, 2px `danger` border, `danger` text (6.57:1).
2. **Physical separation.** Delete lives at the bottom of the form, below a 1px `line` rule and at least 24px from any other control. It is never adjacent to "Salvesta".
3. **Red becomes filled only inside the confirmation dialog** — where the user has already committed attention and there is nothing else to mis-tap.
4. **The confirmation dialog is specific, never generic.** Native `<dialog>`, `--radius-panel`, `--shadow-overlay`. Title: "Kustuta töö?". Body names the thing and the consequence: *"Kustutatakse töö „Vannitoa remont" ja 12 fotot. Seda ei saa tagasi võtta."* Generic "Are you sure?" dialogs get dismissed reflexively; naming the object is what actually prevents the mistake.
5. **Button order is inverted on mobile.** "Tühista" (secondary) renders **first / on top**, "Jah, kustuta" (filled `danger`, white text, 6.57:1) second / below — so the thumb's resting position lands on cancel, not on delete. Both 56px, full width, 12px gap.
6. **Undo where it is cheap.** If projects are soft-deleted, show an 8-second toast with a "Võta tagasi" button (56px tall). If a hard delete is unavoidable, the dialog is the only guard and must therefore stay specific.
7. **Publish / unpublish is a labelled switch**, never a bare colour state: visible text ("Avaldatud" / "Mustand") plus the colour plus the dot glyph. Colour alone is never the carrier of meaning.

### Feedback blocks

- **Error**: `danger-soft` background, 3px left `danger` rule, `--radius-panel`, 16px padding, `fg-strong` text (16.43:1), warning glyph, `role="alert"`.
- **Success**: `success-soft` background, 3px left `success` rule, checkmark glyph, `aria-live="polite"`.
- Messages are plain Estonian and state cause + fix: *"Fotot ei õnnestunud üles laadida — fail on liiga suur (max 20 MB). Proovi väiksemat pilti."* Never a stack trace, never an error code.

---

## 10. Motion

The complete allowed set. Anything not listed here is **not permitted**.

| Token | Duration | Easing | Used for |
|---|---|---|---|
| `--transition-duration-fast` | **120ms** | `--ease-out` | Colour, background, border and outline changes: buttons, links, nav, table rows, inputs |
| `--transition-duration-base` | **180ms** | `--ease-out` | Opacity fades: lightbox backdrop, mobile menu, toast in |
| `--transition-duration-slow` | **240ms** | `--ease-out` | The single transform on the public site — project card image `scale(1) → scale(1.03)` |
| `--transition-duration-exit` | **120ms** | `--ease-in` | All exits (≈65% of enter, so dismissal feels immediate) |

Easings: `--ease-out: cubic-bezier(0.2, 0, 0.1, 1)` · `--ease-in: cubic-bezier(0.4, 0, 1, 1)`. `--ease-out` intentionally overrides Tailwind's default so the built-in `ease-out` utility and hand-written CSS share one curve.

Plus `scroll-behavior: smooth` on `html` for anchor navigation, with `scroll-padding-top` sized to the sticky header.

**Only these properties may be animated:** `opacity`, `transform`, `background-color`, `border-color`, `color`, `box-shadow`, `outline-color`, `text-decoration-color`. Never `width`, `height`, `top`, `left`, `margin` or `padding` — they force layout and cause CLS.

**Explicitly banned:** scroll-triggered reveals, staggered entrance animations, parallax, counting-up numbers, marquees, typewriter effects, skeleton shimmer on the public site, hover effects that move layout, and any animation library. There are no JS-driven animations in this project.

**Reduced motion** (`prefers-reduced-motion: reduce`, implemented in `globals.css`): all transition and animation durations drop to **1ms** — not `0s`, so `transitionend` listeners still fire and no interaction logic silently stalls — and `scroll-behavior` reverts to `auto`.

---

## 11. Implementation notes

- **`globals.css` is valid Tailwind v4.3.3** — compiled through `@tailwindcss/postcss` with zero warnings; all 66 custom utilities (`text-h1`, `bg-accent-soft`, `shadow-frame`, `aspect-cover`, `px-gutter`, `py-section`, `h-control-lg`, `duration-slow`, `xs:grid-cols-2`, `on-ink:text-on-ink-muted`, …) verified to generate.
- **`@theme static`** is used rather than a bare `@theme`. Tailwind v4 tree-shakes theme variables it cannot prove are used, which would silently drop tokens referenced only from hand-written CSS — the photo scrim and the button lip are exactly that. `static` emits all 97 tokens unconditionally, for well under 1KB gzipped.
- **Namespace resets** (`--color-*`, `--text-*`, `--radius-*`, `--shadow-*`, `--container-*` set to `initial`) drop Tailwind's ~250 default palette variables plus the default scales from the output. This is both a payload win and a guardrail: `bg-slate-500`, `text-4xl` and `rounded-3xl` no longer exist, so off-system values cannot appear by accident.
- **`--font-sans` / `--font-display`** are declared in a non-inline `@theme` so they are emitted into `:root` and readable from hand-written CSS, not only from generated utilities.
- **`--font-mono` is left at the Tailwind default** — unused by design, retained only as a sane fallback.
- **Outstanding work outside this deliverable:** `src/app/layout.tsx` still loads Geist and must be switched to the Fira loaders in §4.3, and its `lang` attribute must be driven by the active `next-intl` locale for `hyphens: auto` to function.
