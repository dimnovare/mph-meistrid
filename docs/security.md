# Security

An adversarial review was run against the backend before the front end was written. This
records what was found, what was changed, and what is knowingly accepted. Re-read it before
changing anything in `src/lib/auth.ts`, `src/lib/store.ts`, `src/lib/images.ts` or
`src/app/quote-action.ts`.

## Fixed

| # | Severity | Issue | Fix |
|---|---|---|---|
| 1 | **High** | `src/proxy.ts` matcher was `'…\|.*\..*).*)'`. In a JavaScript string `'\.'` is just `.`, so the alternative became `.*..*` — "any path of one or more characters" — and the negative lookahead failed for every path except `/`. The proxy never ran, which silently disabled **all** locale routing: `/ru` would not have worked. | Escaped as `\\.`, with a comment saying why the second backslash is load-bearing. |
| 2 | Medium | Login rate limiting keyed on the **leftmost** `x-forwarded-for` entry, which is the value the client sends. An attacker could present a new address per request and guess passwords without limit. Separately, the map's size sweep sat after an early `return`, so under exactly that attack it never ran and the map grew unbounded. | `rateLimitKey()` prefers Vercel's unspoofable `x-vercel-forwarded-for` and otherwise takes the **rightmost** XFF entry. The size check moved above the early return and now hard-evicts. |
| 3 | Medium | scrypt at N=2¹⁵ allocates 32 MiB per verification and runs even for an unknown username (deliberately, to equalise timing). With the rate limit bypassed, ~30 concurrent logins exhausted a 1 GB function. | Resolved by fixing #2. The parameters are correct and were left alone. |
| 4 | Medium | Turnstile failed **open**: `if (!secret) return true`. A production deploy that forgot the variable shipped an unauthenticated, unthrottled endpoint sending mail from a domain with valid SPF and DKIM — a silent spam relay. | Fails closed in production, open only in development. `docs/deployment.md` marks the key required. |
| 5 | Medium | Quote-form attachments were never checked. Arbitrary bytes could be posted as `photos` and delivered to the company inbox as `foto-1.jpg`, DKIM-signed by their own domain, to a recipient primed to open it. | Every attachment is now decoded and **re-encoded** through `sharp` and sent as WebP. Non-images are rejected with a plain-language message. |
| 6 | Medium | R2 grants public access per **bucket**, not per prefix, so `data/projects.json` was world-readable at the media domain — exposing unpublished drafts, which the public site deliberately filters out. | Split into two buckets: public media, private data. `npm run check-r2` now fails if the data bucket is missing or publicly readable. |
| 7 | Low | `name` and `phone` could carry interior newlines into the email body, forging extra fields in the message the client reads and acts on. (Not header injection — Resend is a JSON API, not SMTP.) | Both collapsed with `oneLine()` before interpolation. |
| 8 | Low | `architecture.md` documented an in-process write lock that did not exist, and the retry loop had no backoff. Parallel writes to `projects.json` could exhaust four immediate retries and lose a photo while leaving its bytes in R2. | Writes are serialised per key by a promise chain, with exponential backoff and jitter. |
| 9 | Low | An existing object with no ETag fell through to an **unconditional** write, silently dropping concurrency protection. | Treated as a transient fault: back off and re-read. |
| 10 | Low | `deleteProjectAction` deleted a media prefix without checking the project existed. | Now returns "this work no longer exists" instead. |

## Verified sound

These were examined specifically and found correct — do not "fix" them:

- **No `alg` confusion in the session token.** There is no algorithm field and no algorithm
  selection; HMAC-SHA256 is hard-coded and the same function signs and verifies. The
  signature is checked *before* `JSON.parse`, the `timingSafeEqual` length guard precedes the
  comparison, and the `lastIndexOf('.')` split is safe because the MAC covers whatever the
  payload turns out to be.
- **`checkCredentials` leaks nothing.** The full scrypt runs even when the username is wrong,
  so both failure modes cost the same, and one message covers both.
- **The stored password hash is not attacker-controllable**, so the scrypt-parameter
  downgrade that the `scrypt$N$r$p$…` format would otherwise permit is unreachable.
- **Every mutating Server Action calls `guard()` first**, and `redirect()` inside it throws,
  so execution genuinely stops. Every `guard()` call sits outside the surrounding try/catch,
  so no handler can swallow that redirect.
- **The upload route authenticates before buffering the body**, so an unauthenticated caller
  cannot make it read a single byte of multipart data.
- **File type comes from sharp's container sniff, never `Content-Type` or the filename.**
  SVG is excluded, so stored-SVG XSS is not possible. Every stored byte is re-encoded WebP,
  which destroys any polyglot payload. `limitInputPixels` is enforced before pixel decoding,
  on both the metadata read and every resize.
- **No path traversal.** `projectId` is validated by existence lookup before it reaches an R2
  key, and ids come from a 32-character base32 alphabet with no separators. `deletePrefix`
  appends to a rooted prefix, which can only narrow the match.
- **`newId()` has no modulo bias** — 256 % 32 = 0.
- **Next 16's built-in Server Action origin check is active**, and `next.config.ts` sets no
  `allowedOrigins` escape hatch. The upload Route Handler, which does not get that check, has
  its own stricter `sameOrigin()` that also rejects requests with no `Origin` at all.
- **The conditional-PUT concurrency protection is real.** `IfMatch`/`IfNoneMatch` are genuine
  members of `PutObjectRequest` in the installed SDK and are serialised to `If-Match` /
  `If-None-Match` headers — verified against the SDK's runtime schema, not just its types.
- **JSON-LD is escaped.** `jsonLdScript()` escapes `<`, so an admin-entered project title
  containing `</script>` cannot break out of the element.
- **No stack trace, HTTP status, R2 key or credential reaches any client-facing surface.**
  Every user-visible error is a fixed Estonian string.

## Knowingly accepted

- **Rate limiting is per-instance and in memory.** Vercel may run several instances, so it is
  a speed bump, not a guarantee. Acceptable behind one scrypt-hashed password; the cost of
  the alternative (a KV store, an account, a bill) is not justified here.
- **No session revocation list.** Logout clears the cookie; a captured token stays valid until
  its 7-day expiry. Rotating `AUTH_SECRET` is the global logout.
- **No CSP.** Worth pinning against a real deployment rather than guessing origins up front —
  the same call the DIIP Solutions site made. There is no known XSS: React escapes by
  default and the only `dangerouslySetInnerHTML` is the escaped JSON-LD.
- **`failOn: 'error'`** is deliberately looser than sharp's default, because photos off a
  phone are frequently slightly malformed and rejecting them would be a support call.
- **Environment validation is lazy**, on first use rather than at boot.
- **Hostile SVG XML still reaches librsvg** before the format allow-list rejects it. Storage
  is correctly prevented; only the parse happens. Accepted as low risk.

## Re-running the review

Nothing here is automated. When the front end or the admin changes materially, re-run an
adversarial pass over the same eleven areas: authentication, session token, CSRF,
authorization, file upload, path traversal, denial of service, the quote form, data
integrity, information disclosure, and headers.
