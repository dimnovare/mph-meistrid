# Deployment

Target: **Vercel** (DIIP Solutions org) + **Cloudflare** (R2, Email Routing, Turnstile, DNS).
The client owns the domain; they need no Vercel or Cloudflare account of their own.

Do these in order. Steps 1–3 must be done before the first deploy — without R2 credentials
and an admin password hash the app cannot serve a page.

---

## 1. Cloudflare R2 — photo and content storage

Create **two** buckets. This is not optional: R2 grants public access per *bucket*, not per
prefix, so a single bucket would publish the content JSON — including unpublished drafts —
at a guessable URL.

1. Cloudflare dashboard → **R2** → **Create bucket**, twice. Location **EU** for both.
   - `mph-meistrid-media` — photos. Will be public.
   - `mph-meistrid-data` — content JSON. Stays **private**; never attach a domain to it.
2. On `mph-meistrid-media` only: **Settings** → **Public access** → **Connect domain**.
   - Domain: `media.mphmeistrid.ee`
   - This puts the photos on the Cloudflare CDN. The `*.r2.dev` development URL also works
     but is rate limited and must not be used in production.
3. R2 → **Manage API tokens** → **Create API token**.
   - Permission: **Object Read & Write**
   - Scope: **these two buckets only** — not the whole account
   - Copy the Access Key ID and Secret Access Key. The secret is shown once.
4. Note the **Account ID** from the R2 overview page.

The buckets end up holding:

```
mph-meistrid-data   (private)
  data/projects.json          content metadata, including unpublished drafts
  data/pricing.json

mph-meistrid-media  (public via media.mphmeistrid.ee)
  media/projects/{id}/…webp   photos, one WebP per width
```

Verify the private one really is private: `https://media.mphmeistrid.ee/data/projects.json`
must not return anything.

---

## 2. Admin credentials

```bash
npm run hash-password -- "a long password you will remember"
```

It prints `ADMIN_PASSWORD_HASH` and a freshly generated `AUTH_SECRET`. Give the plaintext
password to the client by a channel that is not this repository. The plaintext is never
stored anywhere — losing it means running this command again.

Rotating `AUTH_SECRET` invalidates the current session and forces a fresh login.

---

## 3. Vercel project

Import the repository into the DIIP Solutions org. Framework preset: **Next.js**. No build
command overrides.

Set every variable from `.env.example` under **Settings → Environment Variables**, for
Production **and** Preview:

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://mphmeistrid.ee` |
| `R2_ACCOUNT_ID` | step 1 |
| `R2_ACCESS_KEY_ID` | step 1 |
| `R2_SECRET_ACCESS_KEY` | step 1 — mark as sensitive |
| `R2_BUCKET` | `mph-meistrid-media` — the public one |
| `R2_DATA_BUCKET` | `mph-meistrid-data` — the private one |
| `R2_PUBLIC_BASE_URL` | `https://media.mphmeistrid.ee` |
| `ADMIN_USERNAME` | `admin` unless the client wants another |
| `ADMIN_PASSWORD_HASH` | step 2 |
| `AUTH_SECRET` | step 2 — mark as sensitive |
| `RESEND_API_KEY` | step 5, optional |
| `CONTACT_TO_EMAIL` | step 4 |
| `CONTACT_FROM_EMAIL` | step 5 |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | step 6 |
| `TURNSTILE_SECRET_KEY` | step 6 — **required in production**; without it the quote form refuses to send |

Preview deployments share the production buckets unless you say otherwise, which means an
edit made in a preview admin changes the live site. For a site this small that is usually
acceptable; if it is not, create a third and fourth bucket and override `R2_BUCKET` and
`R2_DATA_BUCKET` for the Preview environment only.

---

## 4. Domain and DNS

1. Register `mphmeistrid.ee` **in the client's name**. They own it.
2. Add the domain to Cloudflare, move the nameservers.
3. In Vercel → **Settings → Domains**, add `mphmeistrid.ee` and `www.mphmeistrid.ee`.
4. In Cloudflare DNS, point both at Vercel as Vercel instructs. Proxy status for the apex
   should be **DNS only** — Vercel terminates TLS and serves its own CDN; proxying through
   Cloudflare as well adds a hop and breaks Vercel's cache headers.
5. `www` → apex is redirected by the app itself (`next.config.ts`), so no page rule needed.

---

## 5. Email

**Inbound — Cloudflare Email Routing.** Free, and gives the client a real
`info@mphmeistrid.ee` that lands in whatever mailbox they already use.

Cloudflare → **Email** → **Email Routing** → Enable. Add a custom address
`info@mphmeistrid.ee` forwarding to the client's personal address, and let Cloudflare add
the MX and SPF records.

Email Routing is receive-only. It has no send API, so it cannot deliver the website's quote
form on its own — that is what Resend is for.

**Outbound — Resend.** resend.com → add and verify `mphmeistrid.ee` as a sending domain
(DKIM plus a return-path record, both added in Cloudflare DNS). Create an API key.

- `CONTACT_FROM_EMAIL` must be on the verified domain, e.g. `vorm@mphmeistrid.ee`.
  It must **not** be the same address as the Email Routing destination, or the forwarding
  loop will bounce.
- `CONTACT_TO_EMAIL` is `info@mphmeistrid.ee`, which Email Routing forwards onward.
- The customer's own address goes in `Reply-To`, so hitting reply in the inbox answers the
  customer directly.

Watch the SPF record: Email Routing and Resend both want one. There must be exactly one
SPF TXT record, containing both mechanisms.

If Resend is not configured the quote form hides itself and the site shows the phone number
instead — the site still works, it just cannot take web enquiries.

---

## 6. Turnstile (optional but recommended)

Cloudflare → **Turnstile** → Add site, domain `mphmeistrid.ee`, widget mode **Managed**.
Copy the site key and secret key into the environment.

In development, a missing secret simply skips the check. **In production a missing secret
makes the form refuse to send** — failing open there would turn the endpoint into a spam
relay sending from a domain with valid SPF and DKIM. The honeypot stays active either way.

---

## 7. First run checklist

After the first successful deploy:

- [ ] `https://mphmeistrid.ee` loads and `https://www.mphmeistrid.ee` redirects to it
- [ ] `https://mphmeistrid.ee/ru` shows the Russian page
- [ ] `/sitemap.xml` and `/robots.txt` return the production domain, not localhost
- [ ] Log in at `/admin`, add a test project with a photo from a phone, publish it
- [ ] The photo appears on the public page and is served from `media.mphmeistrid.ee`
- [ ] Delete the test project; confirm its folder is gone from the media bucket
- [ ] `https://media.mphmeistrid.ee/data/projects.json` returns nothing (drafts are private)
- [ ] Submit the quote form; confirm it arrives and that **Reply** goes to the customer
- [ ] Lighthouse on mobile — see `docs/audit.md` for the recorded scores

---

## Costs

| Item | Cost |
|---|---|
| Vercel | existing DIIP plan |
| R2 storage | 10 GB free, then ~$0.015/GB-month. A few hundred photos is well under 1 GB |
| R2 egress | free — this is the reason for choosing R2 over S3 |
| Cloudflare Email Routing | free |
| Turnstile | free |
| Resend | free to 3 000 emails/month |
| Domain `.ee` | ~EUR 10–20/year, billed to the client |

Vercel image optimisation is **not** used — photos are pre-optimised into R2 and served by
Cloudflare, so there is no per-image cost. See `src/lib/image-loader.ts`.
