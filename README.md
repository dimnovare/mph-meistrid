# MPH Meistrid OÜ — website

Bilingual (Estonian / Russian) one-page site for a construction, renovation and finishing
company, with a deliberately tiny admin area the client runs from their phone.

Next.js 16 · TypeScript · Tailwind CSS v4 · Cloudflare R2 · Vercel

---

## Run it locally

```bash
npm install
cp .env.example .env.local     # then fill it in — see docs/deployment.md
npm run hash-password -- "a password you will remember"
npm run dev
```

Public site on <http://localhost:3000>, admin on <http://localhost:3000/admin>.

Environment variables are validated on first use, and a missing one raises a readable list of
what is absent rather than a cryptic failure deep inside a request. Run `npm run check-r2`
after filling in `.env.local` to confirm the storage side end to end.

```bash
npm run check-r2       # verifies credentials, write, read, public domain and delete
npm run typecheck
npm run lint
npm run build
```

---

## What lives where

| Path | Purpose |
|---|---|
| `src/app/[locale]/` | the public page and the project pages |
| `src/app/admin/` | the admin area and every mutation (Server Actions) |
| `src/app/api/admin/upload/` | the only Route Handler — photo upload needs progress |
| `src/lib/store.ts` | the only module that knows content lives as JSON in R2 |
| `src/lib/auth.ts` | scrypt password, signed session cookie, CSRF, rate limit |
| `src/lib/images.ts` | sharp: EXIF-upright, strip metadata, WebP ladder, blur placeholder |
| `src/i18n/` | next-intl. Estonian at `/`, Russian at `/ru` |
| `src/content/` | developer-edited copy: contacts, services |
| `docs/` | architecture, deployment, content checklist, design system |

Read `docs/architecture.md` before changing anything structural, and `docs/next16-notes.md`
before writing Next.js code — version 16 renamed and changed enough that training-data
instincts are wrong in several places.

---

## Who edits what

**The client, at `/admin`:** completed projects, their photos, and the price list. Nothing
else, on purpose.

**A developer, in the repo:** phone number, email, service area, the list of services, and
all marketing copy. These live in `src/content/site.ts`, `src/content/services.ts` and
`src/i18n/messages/{et,ru}.json`.

Values the client still has to supply are written as `{{PLACEHOLDER}}` and listed in
`docs/CONTENT.md`. The site refuses to render a placeholder as a working phone link, so an
unreplaced value is visible rather than silently broken.

---

## Deployment

Vercel (DIIP Solutions org) plus Cloudflare for R2, DNS, Email Routing and Turnstile.
Full step-by-step in **`docs/deployment.md`** — do those steps before the first deploy,
because the app cannot serve a page without R2 credentials and an admin password hash.
Note that it needs **two** R2 buckets: a public one for photos and a private one for the
content JSON.

Required environment variables are documented in `.env.example`.

---

## Two things worth knowing

**Photos are optimised twice.** The browser downscales before upload — that is what makes
uploading from a building site over mobile data workable, and it side-steps HEIC entirely
because the phone decodes its own format. The server then produces the WebP ladder with
sharp. Images are served straight from the Cloudflare CDN through a custom `next/image`
loader, so Vercel image optimisation is never invoked and costs nothing.

**There is no database.** Content is two JSON objects in a private R2 bucket, beside a
public one holding the photos.
One administrator, a small portfolio, infrequent edits — a database would add an account, a
bill and a migration story to a EUR 200 site. Writes use a conditional PUT so a concurrent
edit fails loudly instead of silently overwriting. If the portfolio ever outgrows this,
`src/lib/store.ts` is the only file that changes.

---

## Known limits, stated deliberately

- Login rate limiting is per-instance and in memory, keyed on the platform-supplied client
  address. Vercel may run several instances, so it is a speed bump rather than a guarantee —
  acceptable behind one scrypt-hashed password.
- The quote form requires Cloudflare Turnstile in production and refuses submissions if the
  secret is missing, rather than silently becoming an open mail relay.
- Two administrators editing at the same moment will make one of them retry. There is one
  administrator.
- Deleting a project deletes its photos. If that cleanup fails, the metadata is already gone
  and some bytes are orphaned in the bucket — the safe direction to fail in.
