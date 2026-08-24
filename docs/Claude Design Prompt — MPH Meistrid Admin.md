# MPH Meistrid — Admin Area Design Brief

Design the administration area of the MPH Meistrid OÜ website.

This is **not** a greenfield brief. The admin is already built and working; every screen and
control below exists in code. What is wanted is a design pass over it: visual design,
hierarchy, spacing, and the handful of genuinely open decisions listed at the end.

Read `docs/design-system.md` first — especially **§9 Admin UI direction**, which is the
governing spec, plus §3 colour and §5 spacing. The tokens in `src/app/globals.css` are the
only colours and sizes that exist; there is no other palette.

---

## 1. Who this is for

One person. A builder. He is standing in a finished bathroom holding a 360px Android phone
in one hand, in daylight, with dust on his fingers, and he wants today's job on the website
in under a minute. He is not comfortable with computers and will not read instructions.

Every decision below follows from that. This constraint outranks aesthetics. If a screen
looks better but takes him longer to understand, the screen is wrong.

Concretely, this means the admin is **plainer and larger** than the public site, not a
denser version of it:

| Property | Admin | Public site |
|---|---|---|
| Button height | **56px** | 48px |
| Dashboard primary action | **88px** | — |
| Input height | **56px** | 48px |
| Base body text | **18px** | 16–17px |
| Label text | **16px**, weight 600 | 14px |
| Smallest text anywhere | **16px** | 13px |
| Minimum touch target | **56 × 56px** | 44 × 44px |
| Minimum gap between targets | **12px** | 8px |
| Border width | **2px** `line-strong` | 1px `line` |
| Radius | `radius-panel` 8px | 4px |

Body text uses `fg-strong` (18.70:1), not `fg`. `fg-muted` is allowed only for helper lines
the user never has to read to make a decision. That is the daylight-glare allowance, and it
is deliberate.

**One column up to 900px. No sidebar, no tabs, no drawers, no accordions.** Scrolling is
free; navigating is not.

**No developer language anywhere.** Not "slug", not "publish state", not "metadata", not
"CDN", not an HTTP status. The Estonian strings are already written and live in
`src/content/admin-text.ts` — that file is the source of truth for copy, and it is worth
reading, because its comments explain why several strings are worded the way they are.

The admin is Estonian-only. The public site is bilingual, so the admin has Estonian and
Russian *fields*, but its own interface is Estonian.

---

## 2. Screen inventory

Seven screens. Every element listed exists.

### 2.1 Login — `/admin/login`

The only screen a stranger can reach.

- Company wordmark
- `h1` "Logi sisse"
- Username field — 56px, label above, placeholder, `autoComplete="username"`
- Password field — 56px, with a **show/hide password toggle** ("Näita parooli" / "Peida
  parool") as a real text button, not an icon
- Submit button, full width, with a working state ("Login sisse…")
- Error block — `role="alert"`, `danger-soft` background, 3px left `danger` rule. Deliberately
  never says which of the two fields was wrong
- Help line at the bottom naming who to phone if he is locked out

No "forgot password" link — there is no such flow, by design. No registration. No branding
flourish; this screen's whole job is to be typed into quickly.

**States to design:** rest, focused field, password visible, submitting, wrong credentials,
too many attempts (rate-limited).

### 2.2 Dashboard — `/admin`

The first screen he ever sees, and on day one it has nothing on it.

- `h1` "Kodulehe haldus", sub-line "Mida soovid teha?"
- **`+ Lisa uus töö`** — 88px, full width, `accent` fill, 20px text, with a one-line hint
  beneath it
- **`Muuda hindu`** — 88px, full width, secondary (2px `fg-strong` border), with its own hint
- `h2` "Tehtud tööd" and a count ("3 tööd")
- The project list, or the empty state
- `Vaata kodulehte` link at the bottom

**Empty state matters more than the populated one** — it is what a reviewer and the client
both see first. Currently one sentence telling him to press the button above.

### 2.3 Project row (inside the dashboard list)

One row per job, minimum 88px tall:

- 4:3 thumbnail, or a "Fotot ei ole" placeholder
- Title at 18px/600 — or "Uus töö" when the draft has no name yet
- **Status chip** — never colour alone: a dot glyph (filled = published, hollow = draft) plus
  the words "Kodulehel näha" / "Mustand — kodulehel ei ole näha"
- Photo count, and "Muudetud 14.8.2026"
- **↑ / ↓ reorder buttons** — these set the order on the public site
- `Muuda` and `Kustuta` buttons

### 2.4 Add / edit a job — `/admin/tood/[id]`

The most important screen in the project. Order on screen follows the order he thinks in:
**name → photos → optional details → publish.**

- Back / cancel control
- **Töö nimi** — required. Estonian field plus a Russian field beside it, with a hint
  explaining that leaving Russian empty means Russian visitors see the Estonian text
- **The photo manager** (§2.5) — deliberately second, before the optional fields
- **Asukoht** — optional, ET + RU
- **Kirjeldus** — optional, ET + RU
- **Sticky bottom action bar** — `ink` background, `shadow-bar`, holding the single primary
  action so it stays permanently inside the thumb-reachable bottom third:
  - Primary: `Avalda töö`, or `Salvesta muudatused` once already published
  - Secondary: `Salvesta mustandina`, or `Võta kodulehelt maha`
- **`Kustuta töö`** — at the very bottom, below a rule, at least 24px from anything else

There is a browser warning if he navigates away mid-edit with unsaved changes.

**States:** new empty draft, draft with content, published job, saving, publishing,
deleting, title-missing error.

### 2.5 Photo manager (inside the edit screen)

- Heading "Fotod" and a count
- A notice when the 30-photo cap is reached
- **Dropzone** — minimum 180px, 2px **dashed** `line-strong`, `surface` background. The whole
  zone is a label wrapping the file input, so a tap anywhere opens the picker. Contains
  "Lisa fotod", a hint about choosing from the phone, and a desktop drag-and-drop hint
- **Upload progress block** — "Laadin üles 3 / 8" as text *and* a bar, plus "Ära sulge lehte"
- Empty state when there are no photos
- **Each stored photo** is a row with: preview, a "Kaanepilt" badge or a `Tee kaanepildiks`
  button, ↑ / ↓ buttons, and `Eemalda foto`
- **Each uploading photo** is a row with: preview, a 6px progress bar with `accent` fill, and
  on failure its own error message with `Proovi uuesti` and `Eemalda`
- Two hints below: which photo is the cover, and how to reorder

Photos upload **one at a time**, each with its own progress, its own error and its own retry
— a dropped connection costs one photo, not eight.

**Reordering is ↑ / ↓ buttons, not drag.** This is not a preference: HTML5 drag-and-drop does
not fire on touch, so a draggable list would simply not work on the device he is holding.
Please do not design a drag affordance.

### 2.6 Prices — `/admin/hinnad`

- Success notice after saving; an "unsaved changes" notice while dirty
- Empty state
- **Each row**: service name (ET + RU), price as free text, an optional note (ET + RU),
  ↑ / ↓ buttons, and `Eemalda rida`
- `Lisa rida`
- **Sticky bottom bar** with one `Salvesta` button

The price is deliberately free text — "alates 12 €/m²", "kokkuleppel" — because the client
owns the exact wording. Never design it as a number input with a currency dropdown.

### 2.7 Error and not-found screens

Two near-identical screens, both deliberately bare: one Estonian sentence saying what
happened, a `Proovi uuesti` button where retrying makes sense, and a route back to the
dashboard. **Never a stack trace, an error code, or an English word.**

---

## 3. Shared components

- **Admin header** — wordmark linking to the dashboard, and `Logi välja` with a confirmation
- **Confirmation dialog** — native `<dialog>`. Title, body naming the specific thing and its
  consequence, an optional "did you mean to do the other thing instead?" line, then the
  buttons
- **Notice block** — error (`danger-soft`, 3px left `danger` rule, warning glyph,
  `role="alert"`) and success (`success-soft`, checkmark, `aria-live="polite"`)
- **Field** — 56px input, 16px/600 label above it, optional hint, error beneath. The label is
  always a real label, never a placeholder standing in for one
- **Bilingual field** — the Estonian input with the Russian one beside it and the fallback
  explained

---

## 4. Destructive actions — the rule that must survive the design pass

**Red never sits in a resting position where a thumb might land on it.**

1. Delete is never the primary action and never a filled red button at rest. At rest it is
   secondary: white, 2px `danger` border, `danger` text.
2. It is physically separated — bottom of the form, below a rule, ≥24px from anything else,
   never adjacent to Save.
3. Red becomes *filled* only inside the confirmation dialog, where attention is already
   committed and there is nothing else to mis-tap.
4. The dialog is **specific, never generic**. It names the thing and the consequence:
   *"Kustutatakse töö „Vannitoa remont" ja 12 fotot. Seda ei saa tagasi võtta."* A generic
   "Are you sure?" gets dismissed reflexively; naming the object is what prevents the
   mistake.
5. **Button order is inverted on mobile.** Cancel renders first / on top, the destructive
   confirm second / below, so the thumb's resting position lands on cancel. Cancel takes
   focus. Both 56px, full width, 12px gap.
6. The delete dialog carries a line pointing at the safer alternative — "if you only want it
   off the website, use *Võta kodulehelt maha* instead". This line exists specifically to
   stop him destroying a job when he only meant to hide it. Please keep it visible; it is
   not fine print.

---

## 5. Already decided — please do not redesign

These are load-bearing and were chosen for reasons that will not be visible in a mockup:

- **↑ / ↓ instead of drag** for every reorder — drag does not work on touch.
- **Photos second, before the optional fields**, in the edit form.
- **One tap from the dashboard creates the draft**, so the photo uploader has somewhere to
  put files before anything has been typed.
- **The file input sets no `capture`** — forcing the camera would remove access to the photo
  library, which is the common case.
- **Free-text prices**, not numeric inputs.
- **Status chips carry a glyph and words**, never colour alone.
- **Estonian-only interface** with ET/RU content fields.
- The token set. There is no second palette, no additional font, and no icon library — icons
  are hand-inlined SVG using `currentColor`.

---

## 6. Genuinely open — this is where design is wanted

1. **The dashboard empty state.** Day one, nothing on it. Right now it is one sentence. This
   is the first impression of the whole product for both the client and anyone reviewing it,
   and it deserves more thought than it has had.
2. **The project row.** Currently thumbnail, title, chip, two lines of meta and four
   controls, all competing. At 360px it is dense. Worth rethinking the hierarchy: what does
   he actually scan for, and what can recede?
3. **The photo manager's photo list.** Built as full-width rows. §9 of the design system
   originally called for a 3-column thumbnail grid with overlay controls. Rows won on
   touch-target grounds, but the question is genuinely open — a grid shows eight photos at a
   glance where rows show three, and "which photo is the cover" is a visual question.
   If you propose a grid, the ↑ / ↓ buttons and `Tee kaanepildiks` still need to be reachable
   at 56px.
4. **A separate "Tee foto" camera button.** §9 asked for one alongside the library picker;
   it was not built, and no Estonian string exists for it yet. Worth deciding whether it earns
   its place — he is standing in the room he just finished.
5. **Upload progress.** Currently a per-photo bar plus a count. Under a poor signal this is
   the screen he stares at longest. Is there a better shape for it?
6. **The sticky bottom bar** — dark `ink` band on a light page. It works, but it has had no
   design attention and it is the most-seen element in the admin.
7. **Undo.** Deletion is currently permanent, guarded only by the dialog. If a soft delete
   with an 8-second "Võta tagasi" toast is worth the complexity, make that case.

---

## 7. Deliverables

Design at **360px first**, then show 768px and desktop. Every screen in §2, plus the
component states in §3.

For each screen: rest, loading/saving, error, and empty where one exists.

Show the destructive-action flow end to end — resting state, dialog, and what he sees
afterwards — because that is the flow most likely to be got wrong and most expensive when it
is.

Use the existing tokens and name them. A design that introduces a colour or a size outside
`src/app/globals.css` cannot be built without changing the design system, so if you want one,
say so explicitly and justify it rather than quietly using it.

The final test for every screen is the same one: **can he understand it without being told,
one-handed, in daylight, in a hurry?**
