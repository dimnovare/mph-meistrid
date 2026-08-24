# Final audit

The brief asks for the finished site to be judged from four points of view. This is that
review, run against the real build on 2026-08-24. Where something is not yet true, it says so
rather than being scored generously.

Verified by: `npm run typecheck`, `npm run lint`, `npm run check-messages`, `npm run build`,
and driving the running site in a browser at 360px, 1440px, in both languages, plus the admin.

---

## 1. Customer

> Can a potential client immediately understand what MPH Meistrid does, see examples, get a
> sense of price, and make contact?

| | |
|---|---|
| What they do | **Yes.** The h1 names the trades and the region, and six service cards say it plainly in a tradesman's language rather than marketing copy. |
| Examples of work | **Structurally yes, actually not yet.** The portfolio grid, project pages and lightbox are built and verified against real photo data. The client has supplied no photographs, so today the section shows a deliberate empty state with a quote CTA rather than an empty grid. This resolves itself the first time they add a job. |
| Approximate pricing | **Structurally yes, actually not yet.** The price list renders, with the "exact price is confirmed in the final quotation" disclaimer. There are no rows until the client supplies numbers — deliberately, because inventing prices was forbidden. |
| How to contact | **Partly.** The quote form works end to end. The phone number and email are still `{{PLACEHOLDER}}`, and the site deliberately refuses to render a placeholder as a live `tel:` link — the call controls fall back to the contact section instead of offering a dead link. This is the correct failure, but it is a failure until `docs/CONTENT.md` is filled in. |

**Verdict:** the shape is right and the conversion path is short — a call CTA is visible at
every scroll position on mobile via the sticky bar. The site is not launchable until the
client returns `docs/CONTENT.md`, and that is content, not engineering.

---

## 2. Builder / administrator

> Can a non-technical person log in, add a project, upload photos from a phone, delete the
> wrong photo, and change prices — without instructions?

Tested at 360px, the width of a cheap Android phone.

- **Log in** — two fields, one large button, `autoComplete` wired so the phone's password
  manager fills it. Errors say what to do next and never reveal which field was wrong.
- **Add a project** — the dashboard's first control is `+ Lisa uus töö`. One tap creates a
  draft and lands on a screen that is already ready for photos, so nothing has to be saved
  before pictures can be added.
- **Upload from a phone** — `accept="image/*"` with no `capture`, so the photo library is
  offered rather than forcing the camera. Photos upload one at a time, each with its own
  progress bar, its own error and its own retry: a dropped connection costs one photo, not
  eight. Every photo is downscaled in the browser first, which is what makes this work over
  mobile data from a building site, and which handles the iPhone's HEIC without any
  server-side dependency.
- **Delete the wrong photo** — confirmation dialog, consequence in plain words, cancel is the
  safe default and takes focus.
- **Reorder** — explicit ↑/↓ buttons, not drag. HTML5 drag-and-drop does not fire on touch,
  so a draggable list would simply not work on the device he is holding. *The hint text used
  to tell him to hold and drag; that was caught in review and rewritten to describe the
  buttons.*
- **Change prices** — inline rows, one Save button.
- **When something breaks** — verified by running the admin against unavailable storage: he
  gets one Estonian sentence, a "try again" button and a way back. No stack trace, no status
  code, no English.

**Verdict:** yes, with one caveat — `{{SUPPORT_CONTACT}}` still renders literally in three
error messages. He must not be shown `{{SUPPORT_CONTACT}}` when something has already gone
wrong, so this is a launch blocker on the content checklist.

---

## 3. Search engine

Verified against the served HTML, not against intent.

- **Crawlable** — `robots.txt` allows the site, disallows `/admin` and `/api`, and points at
  the sitemap. `/admin` additionally carries `X-Robots-Tag: noindex, nofollow`.
- **Understands the company** — `GeneralContractor` + `WebSite` JSON-LD on every page,
  carrying the legal name and registry code 17317439. Nothing is asserted that the client has
  not supplied: no invented address, no fabricated phone.
- **Understands the work** — each project page emits `CreativeWork` + `BreadcrumbList` with
  the real photo URLs.
- **Discovers project pages** — `sitemap.xml` lists both locales of the landing page and of
  every published project, each with its `hreflang` alternates, and is regenerated
  immediately after an admin edit rather than waiting for its hourly window.
- **Indexes metadata correctly** — verified: correct `lang`, one canonical per page,
  `hreflang` et/ru/x-default with matching paths, full Open Graph including a generated
  1200×630 image, and Twitter card tags. Project pages override the title via the template.
- **Heading structure** — exactly one `h1` per page, sections at `h2`, cards at `h3`.

**Verdict:** correct. The one thing a crawler will see that it should not is
`{{CITY_ET}}` in the title and description — again, content, and blocking.

---

## 4. Developer

- **Small** — 73 source files. No component library, no icon library, no animation library,
  no drag-and-drop library, no state manager. Runtime dependencies: Next, React, next-intl,
  zod, sharp, the AWS S3 client, and Resend.
- **Understandable** — one module knows where content lives (`src/lib/store.ts`), one knows
  what the logo looks like (`src/components/brand/Logo.tsx`), one knows how a stored photo
  becomes an `<img>` (`src/components/ui/ProjectImage.tsx`). `docs/architecture.md` explains
  the decisions; `docs/next16-notes.md` records the Next 16 API changes that make older
  instincts wrong.
- **Secure** — reviewed adversarially; ten findings fixed, and the reasoning for what was
  deliberately accepted is written down in `docs/security.md`.
- **Easy to deploy** — `docs/deployment.md` is a numbered sequence, and `npm run check-r2`
  verifies the storage side end to end, including that the private bucket really is private.
- **Free of unnecessary architecture** — no database, no CMS, no admin framework, no
  container. Two JSON files and a bucket.

**Verdict:** proportionate to a EUR 200 site. The main long-term risk is that the JSON store
is whole-file read-modify-write; that is documented, bounded to one administrator, and
isolated behind one module.

---

## Measured performance

Production build, landing page, measured over the wire rather than estimated:

| | gzip | raw |
|---|---|---|
| HTML | 14.2 KB | 81 KB |
| CSS | 9.7 KB | 46 KB |
| JavaScript | 201 KB | 645 KB |

The honest breakdown of that JavaScript: **143 KB gzip of it is the React 19 + Next 16 App
Router client runtime**, which contains no application code and cannot be reduced without
abandoning the framework the brief specified. The remaining ~58 KB is next-intl's ICU
formatter, the quote form with its Turnstile widget and browser-side image downscaler, and
route chunks.

Worth stating plainly: this is the floor for Next 16, not a lean result. A hand-written
static page would ship a fraction of it. The brief asked for Next.js, so this is the cost of
that instruction rather than a defect — but if Lighthouse scores disappoint on a slow phone,
this number is why, and the honest fix would be a different framework, not further tuning.

What *is* controlled:

- Photos are pre-optimised into a WebP ladder in R2 and served from the Cloudflare CDN, so
  Vercel image optimisation is never invoked and costs nothing.
- Every image reserves its box before it loads, so there is no layout shift.
- `sizes` is computed per layout rather than guessed — at 360px the browser fetches the 800px
  variant, not the 2000px one.
- Both fonts are self-hosted by `next/font`; no request leaves for Google.
- The public pages are statically prerendered; R2 is not in the request path.
- Only four of twelve message namespaces are sent to the browser.

---

## Blocking before launch

1. Fill in `docs/CONTENT.md` — phone, email, region, the six services, the prices. Until then
   `{{PLACEHOLDER}}` markers are visible to visitors and to Google.
2. `{{SUPPORT_CONTACT}}` in the admin error messages.
3. Provision the two R2 buckets and confirm the data bucket is not publicly readable
   (`npm run check-r2`).
4. Set `TURNSTILE_SECRET_KEY` — the quote form refuses to send in production without it.
5. Replace the placeholder logo once the identity work lands (`public/brand/README.md`).
6. Run Lighthouse against the real deployment and record the scores here.
