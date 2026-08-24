<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# MPH Meistrid

Small bilingual (ET/RU) construction-company site plus a deliberately tiny admin area.
Read `docs/architecture.md` before changing anything structural, and
`docs/next16-notes.md` for the Next 16 APIs this project relies on.

## Non-negotiables from the client brief

- **Do not overengineer.** Given two options, take the simpler one unless the complex one
  buys the user something real. This is a EUR 200 site.
- **Never invent content** — no years of experience, employee counts, certifications,
  warranties, testimonials, project statistics or addresses. Unknown values are
  `{{PLACEHOLDER}}` and listed in `docs/CONTENT.md`.
- The admin is used by a builder on a phone at a building site. No developer jargon in the
  UI, no stack traces, large touch targets, Estonian error messages that say what to do next.
- Server components by default. A `'use client'` boundary needs a reason.

## Layout

- `src/lib/store.ts` — the only module that knows content lives in R2 JSON.
- `src/lib/r2.ts` — S3-API client, conditional writes, prefix delete.
- `src/lib/auth.ts` — scrypt password, HMAC session cookie, CSRF origin check, rate limit.
- `src/lib/images.ts` — sharp: EXIF-upright, strip metadata, WebP ladder, blur placeholder.
- `src/i18n/` — next-intl. Estonian at `/`, Russian at `/ru`.
- `src/proxy.ts` — Next 16's renamed middleware. Locale routing + optimistic admin redirect.

## Commands

```
npm run dev
npm run build
npm run typecheck
npm run lint
npm run hash-password -- "password"
```
