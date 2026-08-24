# Next.js 16.3.2 — API cheat-sheet

Source of truth: `node_modules/next/dist/docs/` (bundled with next@16.3.2), cross-checked against
`node_modules/next/*.d.ts` and `node_modules/next/dist/**`. Every claim cites the doc file it came
from, relative to `node_modules/next/dist/docs/`. Where the docs and the shipped `.d.ts` disagree,
both are given and the disagreement is flagged.

**Project baseline (matters for §4):** `next.config.ts` is empty — `cacheComponents` is **OFF**.
React 19.2.8, `next-intl` 4.13.7, `@aws-sdk/client-s3` (Cloudflare R2), Vercel.

---

## BREAKING CHANGES vs Next 15 and earlier

Everything an agent with pre-16 training data will get wrong.

### 1. `middleware.ts` → `proxy.ts` — exact convention

| | Next ≤15 | Next 16.3.2 |
|---|---|---|
| File | `middleware.ts` | **`proxy.ts`** |
| Export | `export function middleware(...)` | **`export function proxy(...)`** or default export |
| Runtime | `edge` (default) or `nodejs` | **`nodejs` only, not configurable** |
| Type | `NextMiddleware` | **`NextProxy`** (`NextMiddleware` is `@deprecated`) |
| Config type | `MiddlewareConfig` | **`ProxyConfig`** |
| URL-normalize flag | `skipMiddlewareUrlNormalize` | **`skipProxyUrlNormalize`** |

- Location: **project root, or `src/`** — same level as `app/`/`pages/`. Only one per project.
  With a custom `pageExtensions`, name it `proxy.page.ts`.
  (`01-app/03-api-reference/03-file-conventions/proxy.md`; confirmed in
  `dist/lib/constants.js`: `PROXY_FILENAME = 'proxy'`, `PROXY_LOCATION_REGEXP = '(?:src/)?proxy'`)
- `middleware.ts` still works but is **deprecated**
  (`01-app/03-api-reference/03-file-conventions/middleware.md`). Codemod:
  `npx @next/codemod@canary middleware-to-proxy .`
- **The `edge` runtime is NOT supported in `proxy`.** Setting `export const runtime` in a proxy file
  **throws**. (`01-app/02-guides/upgrading/version-16.md`,
  `01-app/03-api-reference/03-file-conventions/route-segment-config/runtime.md`)
- Version history row: `` v16.0.0 | Middleware is deprecated and renamed to Proxy. Proxy defaults to the Node.js runtime ``
  (`01-app/03-api-reference/03-file-conventions/proxy.md`)

### 2. `params` / `searchParams` are Promises — synchronous access is **removed**

Next 15 made them Promises with a temporary sync-compat shim. **Next 16 removed the shim entirely.**
(`01-app/02-guides/upgrading/version-16.md` § "Async Request APIs (Breaking change)")

Now-async, no fallback:
- `cookies()`, `headers()`, `draftMode()`
- `params` in `layout.js`, `page.js`, `route.js`, `default.js`, `opengraph-image`, `twitter-image`, `icon`, `apple-icon`
- `searchParams` in `page.js`

**New in 16 (not in Next 15):**
- `opengraph-image` / `twitter-image` / `icon` / `apple-icon` image functions receive `params` **and**
  `id` as Promises. `generateImageMetadata` itself still gets a **synchronous** `params`.
  (`01-app/02-guides/upgrading/version-16.md`; `01-app/03-api-reference/04-functions/generate-image-metadata.md`
  — v16.0.0 rows)
- `sitemap()` receives `id` as a **Promise**, not a number.
  (`01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md` — `` v16.0.0 | `id` is now a promise that resolves to a `string`. ``)

Codemod for leftovers: `npx @next/codemod@canary next-async-request-api .`

### 3. `revalidateTag` now requires a **second argument**

```ts
// Next 15 — now a TypeScript error
revalidateTag('posts')

// Next 16
revalidateTag('posts', 'max')
```

Confirmed signature (`dist/server/web/spec-extension/revalidate.d.ts`):
```ts
export declare function revalidateTag(tag: string, profile: string | { expire?: number }): undefined;
```
- The single-arg form "currently works if TypeScript errors are suppressed, but this behavior may be
  removed in a future version." (`01-app/03-api-reference/04-functions/revalidateTag.md`)
- Second arg is a `cacheLife` profile name (`'max'` recommended → stale-while-revalidate) **or**
  `{ expire: number }`. `{ expire: 0 }` = immediate expiry, documented for webhooks/Route Handlers.
- **`revalidateTag` cannot be called in Client Components or Proxy.**

### 4. Two brand-new cache APIs: `updateTag` and `refresh`

Both from `next/cache` (`dist/cache.d.ts` confirms exports:
`unstable_cache, revalidatePath, revalidateTag, updateTag, refresh, unstable_noStore, io, cacheTag, cacheLife`).

| | `updateTag(tag)` | `revalidateTag(tag, profile)` | `refresh()` |
|---|---|---|---|
| Where | **Server Actions only** | Server Actions + Route Handlers | Server Actions |
| Behavior | expires immediately; next read blocks for fresh data | stale-while-revalidate | refetches the current route's RSC payload |
| Use for | read-your-own-writes | background refresh | state outside the cache |

(`01-app/03-api-reference/04-functions/updateTag.md`, `.../revalidateTag.md`, `.../refresh.md` via
`01-app/01-getting-started/07-mutating-data.md`)

`updateTag` in a Route Handler **throws**: `Error: updateTag can only be called from within a Server Action`.

### 5. `unstable_cache` vs `use cache`

- `unstable_cache` is **not removed** and **not renamed**. It is still exported from `next/cache` and
  still documented, with this banner:
  > "This API has been replaced by `use cache` in Next.js 16. We recommend opting into Cache
  > Components and replacing `unstable_cache` with the `use cache` directive."
  (`01-app/03-api-reference/04-functions/unstable_cache.md`)
- `use cache` **requires `cacheComponents: true`** in `next.config.ts`. Without it the directive is
  not available. (`01-app/03-api-reference/01-directives/use-cache.md`)
- `cacheLife` and `cacheTag` are now **stable** — drop the `unstable_` prefix:
  ```ts
  // Next 15
  import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from 'next/cache'
  // Next 16
  import { cacheLife, cacheTag } from 'next/cache'
  ```
  (`01-app/02-guides/upgrading/version-16.md`). The `unstable_*` aliases still exist in
  `dist/cache.d.ts` for compat.
- `use cache` **cannot be used directly inside a Route Handler body** — extract it to a helper.
  (`01-app/01-getting-started/15-route-handlers.md`)
- Docs explicitly say: "For data that needs to persist across deploys, use `unstable_cache` for
  non-`fetch` functions or the `fetch` cache." (`01-app/03-api-reference/01-directives/use-cache.md`)

### 6. Caching defaults

- **`fetch` is NOT cached by default.** Default is `auto no cache`: fetched every request in dev;
  fetched once during `next build` if the route prerenders; every request if request-time APIs are
  detected. Opt in with `cache: 'force-cache'`.
  (`01-app/03-api-reference/04-functions/fetch.md`) — unchanged from 15, but still the #1
  training-data error.
- **Route Handlers are NOT cached by default.** Only `GET` can opt in, via
  `export const dynamic = 'force-static'`. (`01-app/01-getting-started/15-route-handlers.md`)
  With Cache Components on, `GET` handlers follow the page prerender model instead.
- **Only `200` responses are stored** by the fetch cache.

### 7. `next.config.ts` — removed / renamed keys

**Removed outright** (`01-app/02-guides/upgrading/version-16.md` § Removals):

| Removed | Replacement |
|---|---|
| `amp`, `next/amp`, `export const config = { amp: true }` | — (AMP support gone) |
| `eslint: {}` | ESLint CLI directly; `next lint` command removed; `next build` no longer lints |
| `serverRuntimeConfig`, `publicRuntimeConfig`, `next/config` | env vars (`NEXT_PUBLIC_*`), `connection()` for runtime reads |
| `devIndicators.appIsrStatus` / `.buildActivity` / `.buildActivityPosition` | — |
| `experimental.dynamicIO` | top-level `cacheComponents` |
| `experimental.useCache` | top-level `cacheComponents` |
| `experimental.ppr` | top-level `cacheComponents` |
| `export const experimental_ppr = true` (segment) | `cacheComponents` |
| `experimental.turbo` / `experimental.turbopack` | top-level `turbopack` |
| `unstable_rootParams()` | `next/root-params` |

**Renamed:**
- `skipMiddlewareUrlNormalize` → **`skipProxyUrlNormalize`**
- `serverComponentsExternalPackages` → `serverExternalPackages` (was 15.0.0)
- `experimental.typedRoutes` → top-level `typedRoutes`
- `experimental.browserDebugInfoInTerminal` → `logging.browserToTerminal` (v16.2.0)

**Promoted to top level in 16:** `cacheComponents`, `turbopack`, `reactCompiler`, `typedRoutes`,
`adapterPath`, `cacheHandlers`, `partialPrefetching` (16.3.0).

### 7b. New APIs that did not exist in Next 15

| API | Import | Introduced | What it does |
|---|---|---|---|
| `updateTag(tag)` | `next/cache` | v16.0.0 | immediate tag expiry, **Server Actions only** |
| `refresh()` | `next/cache` | v16.0.0 | refetch current route RSC payload from a Server Action |
| `io()` | `next/cache` | **v16.3.0** | suspend prerendering for a sync non-deterministic value; **preferred over `connection()`** |
| `catchError(fallback)` | `next/error` | stable **v16.3.0** (`unstable_catchError` 16.2.0) | component-level error boundary |
| `next/root-params` | `next/root-params` | **v16.3.0** | replaces the removed `unstable_rootParams` |
| `'use cache: remote'` | directive | v16.0.0 | durable shared cache via `cacheHandlers.remote` |
| `'use cache: private'` | directive | v16.0.0 | cache a scope that reads `cookies()`/`headers()`/`searchParams`; browser-only storage |
| `useOffline()` | `next/offline` | v16.x (placeholder in docs) | experimental; needs `experimental.useOffline: true` |
| `export const prefetch` / `instant` | segment config | v16.x | Cache Components only |
| `<Link transitionTypes>` | `next/link` | v16.2.0 | React `addTransitionType` |
| `router.bfcacheId` | `useRouter()` | undated | opaque per-segment id, stable across back/forward |
| `robots.other` | `app/robots.ts` | v16.3.0 | non-standard per-agent directives |

`io()` vs `connection()` (`01-app/03-api-reference/04-functions/io.md`):
> "`connection()` … stays suspended until a full user navigation reaches the server, so it also blocks
> prefetches. `io()` suspends like any other asynchronous function, so the code after it can be wrapped
> in `"use cache"` and prefetched and cached on the client. **Prefer `io()` over `connection()`**, and
> reach for `connection()` only when you need to wait for a real user request."

```tsx
import { io } from 'next/cache'

export default async function Page() {
  await io()                    // excludes what follows from the static shell
  const now = new Date()
  return <p>{now.toISOString()}</p>
}
```
Both are no-ops without `cacheComponents`. `connection()` imports from **`next/server`**, `io()` from
**`next/cache`**.

### 7c. `NextRequest` — `ip` and `geo` were removed in **v15.0.0**, not v16

`01-app/03-api-reference/04-functions/next-request.md` version history has exactly one row:
`` v15.0.0 | ip and geo removed. `` — **no v16 removals.** App Router `nextUrl` exposes only
`basePath`, `buildId`, `pathname`, `searchParams`; the Pages-Router i18n properties
(`locale`, `locales`, `defaultLocale`, `domainLocale`) are **not available in the App Router**.
`request.page` and `request.ua` are `@deprecated` in the `.d.ts` and undocumented.

### 8. `next/image` prop + config changes

**Props:**
- **`priority` is DEPRECATED.** Use **`preload`** (new in v16.0.0). Verbatim:
  "Starting with Next.js 16, the `priority` property has been deprecated in favor of the `preload`
  property in order to make the behavior clear." (`01-app/03-api-reference/02-components/image.md`)
  `priority` still exists in `dist/shared/lib/get-img-props.d.ts` with `@deprecated`.
  Docs further advise: "In most cases, you should use `loading="eager"` or `fetchPriority="high"`
  instead of `preload`."
- `onLoadingComplete` deprecated since 14 → `onLoad`.
- `next/legacy/image` deprecated.
- **No `next/image` prop was removed in v16.**

**Config defaults that changed in 16** (`01-app/02-guides/upgrading/version-16.md` § `next/image` changes;
values confirmed in `dist/shared/lib/image-config.js`):

| Key | Next 15 | Next 16 |
|---|---|---|
| `images.qualities` | all qualities allowed | **`[75]`** |
| `images.minimumCacheTTL` | `60` | **`14400`** (4 hours) |
| `images.imageSizes` | `[16,32,48,64,96,128,256,384]` | **`[32,48,64,96,128,256,384]`** (16 removed) |
| `images.maximumRedirects` | unlimited | **`3`** |
| `images.dangerouslyAllowLocalIP` | n/a | **`false`** — local IP optimization now blocked |
| local `src` with query string | allowed | **requires `images.localPatterns.search`** |
| `images.domains` | supported | **deprecated** → `images.remotePatterns` |

**`quality` coercion is the silent one:** if `quality` isn't in `images.qualities`, it is coerced to
the nearest allowed value — `quality={80}` with the default config silently becomes `75`.
Confirmed in `dist/shared/lib/find-closest-quality.js`. A dev-mode warning is logged. A direct hit on
`/_next/image` with a disallowed quality returns **400**.

### 9. `next/link` changes

- `prefetch` accepts **`true | false | 'auto' | null`** (`'auto'` added in v15.4.0). App Router
  default is **`null`/`'auto'`**; Pages Router default is `true`.
  (`01-app/03-api-reference/02-components/link.md`; `dist/client/app-dir/link.d.ts`)
  **There is no `'unstable_forceStale'` value in this version** — zero hits in docs or types.
- New in **v16.2.0**: `transitionTypes?: string[]` — passed to React's `addTransitionType`.
- `legacyBehavior` and `passHref` still exist in `dist/client/app-dir/link.d.ts` but are **absent from
  the v16 docs**; `legacyBehavior` is `@deprecated — This will be removed in a future version`.
  Do not use in new code.
- `shallow` / `locale` / `as` are **Pages Router only**.
- App Router props table: `href` (required), `replace`, `scroll`, `prefetch`, `onNavigate`, `transitionTypes`.

### 10. `error.tsx` / `global-error.tsx` gained a `retry` prop

The docs now use **`retry`**, not `reset`:
```tsx
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void })
```
- Version history: `` v16.3.0 | `retry` prop became stable. `` / `` v16.2.0 | `unstable_retry` prop added. ``
  (`01-app/03-api-reference/03-file-conventions/error.md`)
- **`reset` still works** — `dist/client/components/error-boundary.d.ts` declares
  `ErrorInfo = { error: unknown; reset: () => void; retry: () => void }` and both are passed.
  Difference (from source and `01-app/03-api-reference/04-functions/catchError.md`):
  `retry()` calls `router.refresh()` then resets → re-fetches; `reset()` only clears error state and
  re-renders, so **it will not recover from Server Component errors**. Prefer `retry`.

### 11. Other v16 breaking changes

- **Turbopack is the default** for `next dev` and `next build`. A custom `webpack` config makes
  `next build` **fail**; use `--webpack` to opt out or `--turbopack` to ignore it.
- **Node.js 20.9+**, TypeScript 5.1+, Chrome/Edge/Firefox 111+, Safari 16.4+.
- **All parallel-route slots now require an explicit `default.js`** or the build fails.
- `next dev` writes to **`.next/dev`** (concurrent dev + build); a lockfile prevents two `next dev`
  instances on one project.
- `next dev` no longer includes `'dev'` in `process.argv` (config is loaded once). `typegen` and
  `build` are still visible.
- **`scroll-behavior: smooth` is no longer overridden** during navigation. To restore the old
  behavior add `data-scroll-behavior="smooth"` to `<html>`.
- `next build` output no longer prints `size` / `First Load JS`.
- `@next/eslint-plugin-next` defaults to **flat config**.
- Route segment config `dynamic`, `dynamicParams`, `revalidate`, `fetchCache` are **removed when
  `cacheComponents` is enabled** — they still work when it is off.
  (`01-app/03-api-reference/03-file-conventions/02-route-segment-config/index.md`, v16.0.0 rows)

### 12. Things that did NOT change (don't "fix" them)

- `next-intl`'s import path is still **`next-intl/middleware`**. Only the Next.js *file* is renamed.
  `createMiddleware(routing)` still returns `(request: NextRequest) => NextResponse` — confirmed in
  `node_modules/next-intl/dist/types/middleware/middleware.d.ts`. There is no `next-intl/proxy`.
- `next/font/google` and `next/font/local` import paths are unchanged (`02-components/font.md` version
  table ends at v13.2.0).
- `useActionState` / `useFormStatus` / `useOptimistic` usage is unchanged.
- `redirect()` / `notFound()` still throw control-flow exceptions.
- `metadata` / `generateMetadata` API shape is unchanged (`generate-metadata.md` has **no v16 rows**).

---

## 1. Route segment config, `generateStaticParams`, typed `params`

### Segment config exports (valid keys in 16.3.2)

Confirmed against `dist/build/segment-config/app/app-segment-config.d.ts`:

```ts
// layout.tsx | page.tsx | route.ts
export const dynamic = 'auto'          // 'auto' | 'force-dynamic' | 'error' | 'force-static'   [not with cacheComponents]
export const dynamicParams = true      // boolean, default true                                 [not with cacheComponents]
export const revalidate = false        // false | 0 | number (seconds)                          [not with cacheComponents]
export const fetchCache = 'auto'       // 'auto'|'default-cache'|'only-cache'|'force-cache'|
                                       // 'default-no-store'|'only-no-store'|'force-no-store'   [not with cacheComponents]
export const runtime = 'nodejs'        // 'nodejs' (default) | 'edge' (DEPRECATED)
export const maxDuration = 5           // seconds
export const preferredRegion = 'auto'  // deprecated
export const prefetch = 'partial'      // 'auto'|'partial'|'force-disabled'   [cacheComponents only]
export const instant = true            // boolean | { level: 'warning' }      [cacheComponents only]
```

- `revalidate` **must be statically analyzable**: `revalidate = 600` ✅, `revalidate = 60 * 10` ❌.
- The lowest `revalidate` across a route's layouts + page wins for the whole route.
- `export const experimental_ppr` was **removed** in v16.
- `runtime` cannot be set in `proxy.ts`.

(`01-app/02-guides/caching-without-cache-components.md`,
`01-app/03-api-reference/03-file-conventions/02-route-segment-config/*`)

### `page.tsx` — typed params

Two equivalent forms. The **generated global helper** is preferred:

```tsx
// app/tood/[slug]/page.tsx
// PageProps is globally available after `next dev` / `next build` / `next typegen` — no import.
export default async function Page(props: PageProps<'/tood/[slug]'>) {
  const { slug } = await props.params
  const query = await props.searchParams
  return <h1>{slug}</h1>
}
```

```tsx
// Explicit form — use when the route literal isn't generated yet
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { slug } = await params
  const { page = '1' } = await searchParams
}
```

Client Components can't be `async` — use React's `use()`:
```tsx
'use client'
import { use } from 'react'

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
}
```

`params` shape reference (`01-app/03-api-reference/03-file-conventions/page.md`):

| Route | URL | `params` |
|---|---|---|
| `app/shop/[slug]/page.js` | `/shop/1` | `Promise<{ slug: '1' }>` |
| `app/shop/[category]/[item]/page.js` | `/shop/1/2` | `Promise<{ category: '1', item: '2' }>` |
| `app/shop/[...slug]/page.js` | `/shop/1/2` | `Promise<{ slug: ['1','2'] }>` |
| `/shop?a=1&a=2` | — | `searchParams: Promise<{ a: ['1','2'] }>` |

`searchParams` is a **plain object, not `URLSearchParams`**.

### `layout.tsx`

```tsx
// app/[lang]/layout.tsx
export default async function RootLayout(props: LayoutProps<'/[lang]'>) {
  const { lang } = await props.params
  return (
    <html lang={lang}>
      <body>{props.children}</body>
    </html>
  )
}
```

`LayoutProps<'/dashboard'>` also types named parallel slots (`props.analytics` for `app/dashboard/@analytics`).
(`01-app/03-api-reference/03-file-conventions/layout.md`)

**Layouts do not re-render on navigation** and cannot access the raw request; use `cookies()`/`headers()`
in Server Components instead.

**Performance note:** awaiting `params` at the top of a layout blocks the whole static shell. Pass the
promise down and await it inside a `<Suspense>` boundary to keep more of the page prerendered
(`01-app/01-getting-started/08-caching.md` § Maximizing the static shell).

### `route.ts`

```ts
// app/api/posts/[id]/route.ts
import type { NextRequest } from 'next/server'

// RouteContext is globally available after typegen — no import
export async function GET(_req: NextRequest, ctx: RouteContext<'/api/posts/[id]'>) {
  const { id } = await ctx.params
  return Response.json({ id })
}
```

Explicit form:
```ts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
}
```

### `generateStaticParams`

```tsx
// app/tood/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await fetch('https://.../posts').then((res) => res.json())
  return posts.map((post: { slug: string }) => ({ slug: post.slug }))
}
```

Rules (`01-app/03-api-reference/04-functions/generate-static-params.md`):
- Works in `page`, `layout`, **and `route`**.
- **Always return an array**, even empty, or the route renders dynamically.
- `return []` → all paths rendered on first visit (ISR).
- Runs before layouts/pages during `next build`; **not** re-run during ISR revalidation.
- A child segment can generate params for segments **above** it, never below.
- **With Cache Components:** must return **at least one param** — an empty array is a build error
  (`empty-generate-static-params`).
- Pair with `export const dynamicParams = false` to 404 anything not listed.

With Route Handlers + `use cache`:
```ts
// app/api/posts/[id]/route.ts
export async function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }, { id: '3' }]
}

async function getPost(id: Promise<string>) {
  'use cache'
  const resolvedId = await id
  const response = await fetch(`https://api.example.com/posts/${resolvedId}`)
  return response.json()
}

export async function GET(request: Request, { params }: RouteContext<'/api/posts/[id]'>) {
  const post = await getPost(params.then((p) => p.id))
  return Response.json(post)
}
```

---

## 2. Route Handlers

### Signature and methods

Supported: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`. Anything else → **405**.
If `OPTIONS` is not defined, Next.js implements it and sets the `Allow` header automatically.
There **cannot** be a `route.ts` at the same segment as `page.tsx`.

```ts
// app/api/items/route.ts
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')
  return Response.json({ query })
}
```

### Reading `FormData`

```ts
// app/api/upload/route.ts
export async function POST(request: Request) {
  const formData = await request.formData()
  const name = formData.get('name')          // string | File | null
  const file = formData.get('file') as File | null
  return Response.json({ name, size: file?.size })
}
```
"Since `formData` data are all strings, you may want to use `zod-form-data` to validate the request."
(`01-app/03-api-reference/03-file-conventions/route.md`)
No `bodyParser` config is needed, unlike Pages Router API Routes.

Other body reads: `await request.json()`, `await request.text()`, `request.body` (`ReadableStream`).

### `Response` vs `NextResponse`

```ts
// Plain Web Response is enough for most cases
return Response.json({ ok: true }, { status: 201 })
return new Response('Hello', { status: 200, headers: { 'Content-Type': 'text/plain' } })

// NextResponse adds cookies + typed redirect/rewrite
import { NextResponse } from 'next/server'
const res = NextResponse.json({ ok: true })
res.cookies.set('name', 'value', { httpOnly: true, path: '/' })
return res
```
`headers()` from `next/headers` is **read-only** in a Route Handler — to set headers, return a new
`Response` with them.

### Streaming

```ts
// app/api/stream/route.ts
function iteratorToStream(iterator: AsyncGenerator<Uint8Array>) {
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next()
      if (done) controller.close()
      else controller.enqueue(value)
    },
  })
}

const encoder = new TextEncoder()

async function* makeIterator() {
  yield encoder.encode('<p>One</p>')
  yield encoder.encode('<p>Two</p>')
}

export async function GET() {
  return new Response(iteratorToStream(makeIterator()))
}
```

### Runtime selection

```ts
export const runtime = 'nodejs'   // default; 'edge' is DEPRECATED in 16
export const maxDuration = 30     // seconds; deployment platform enforces
```
Do not add `export const runtime = 'edge'` to new code — see
`01-app/03-api-reference/03-file-conventions/route-segment-config/runtime.md`.

### Caching

```ts
export const dynamic = 'force-static'  // opt a GET handler into caching (no cacheComponents)
export const revalidate = 60           // ISR for the handler
```
- **Not cached by default.** Only `GET` can opt in; other methods are never cached, even in the same file.
- `fetch` memoization does **not** apply in Route Handlers (they're outside the React tree).
- With `cacheComponents: true`, `GET` handlers prerender like pages; `use cache` must live in a helper
  function, not the handler body.

### Body size

| Limit | Default | Config |
|---|---|---|
| Server Action request body | **1 MB** | `experimental.serverActions.bodySizeLimit: '2mb'` |
| Proxy-buffered request body | **10 MB** | `experimental.proxyClientMaxBodySize: '1mb'` |

- The Server Action limit "applies to the raw HTTP request body, including the bytes that
  `multipart/form-data` adds for boundaries, part headers, and field metadata … an additional 10–20 KB
  is a reasonable rule of thumb." (`01-app/03-api-reference/05-config/01-next-config-js/serverActions.md`)
- **Route Handlers have no documented Next.js-level body cap** — the platform's limit applies
  (Vercel function payload limits). But if `proxy.ts` exists, Next.js buffers the body up to
  `proxyClientMaxBodySize`; over that, "only the partial body will be available" and the request
  **does not fail** — it silently truncates with a console warning.
  (`01-app/03-api-reference/05-config/01-next-config-js/proxyClientMaxBodySize.md`)
  **This is a real trap for large uploads in a project that has a `proxy.ts`.**

### CORS

```ts
export async function GET() {
  return new Response('ok', {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
```

---

## 3. Server Actions

### Defining

```ts
// app/lib/actions.ts
'use server'

import { auth } from '@/lib/auth'

export async function createPost(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const title = formData.get('title')
  const content = formData.get('content')
  // mutate + revalidate
}
```

Inline in a Server Component:
```tsx
export default function Page() {
  async function createInvoice(formData: FormData) {
    'use server'
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')
    // ...
  }
  return <form action={createInvoice}>...</form>
}
```

**Security (non-negotiable, `01-app/02-guides/server-actions.md` + `02-guides/data-security.md`):**
- A Server Action is a **public POST endpoint** on the route where it is used. Render-time gating is
  not a security boundary.
- Framework protections: CSRF `Origin` vs `Host` check, 1 MB body cap, encrypted action IDs
  (cached max 14 days, recalculated per build), dead-code elimination of unused actions, and
  encryption of closure variables.
- Multi-instance/self-hosted: set **`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`** (base64, decoded length
  16/24/32 bytes; `openssl rand -base64 32`) so all instances share a key.
- **Proxy matchers do not protect Server Actions reliably**: "Server Functions are not separate routes
  … a Proxy matcher that excludes a path will also skip Server Function calls on that path."
  Always authenticate/authorize **inside** every action.
  (`01-app/03-api-reference/03-file-conventions/proxy.md`)
- Take an **ID**, not the whole record; re-read from a trusted source scoped by session.
- Constrain return values — they are serialized to the client.

### Passing extra arguments

```tsx
'use client'
import { updateUser } from './actions'

export function UserProfile({ userId }: { userId: string }) {
  const updateUserWithId = updateUser.bind(null, userId)
  return (
    <form action={updateUserWithId}>
      <input type="text" name="name" />
      <button type="submit">Update</button>
    </form>
  )
}
```
```ts
'use server'
export async function updateUser(userId: string, formData: FormData) {}
```
`bind` works in Server and Client Components and supports progressive enhancement; hidden inputs do
not encode the value. (`01-app/02-guides/forms.md`)

### Returning state to `useActionState`

The action signature gains `prevState` as the **first** argument:

```ts
// app/actions.ts
'use server'

import { z } from 'zod'

const schema = z.object({ email: z.string() })

export type FormState = { message: string; errors?: Record<string, string[]> }

export async function createUser(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = schema.safeParse({ email: formData.get('email') })
  if (!parsed.success) {
    return { message: 'Invalid', errors: parsed.error.flatten().fieldErrors }
  }
  // mutate
  return { message: 'Created' }
}
```

```tsx
// app/ui/signup.tsx
'use client'

import { useActionState } from 'react'
import { createUser, type FormState } from '@/app/actions'

const initialState: FormState = { message: '' }

export function Signup() {
  const [state, formAction, pending] = useActionState(createUser, initialState)

  return (
    <form action={formAction}>
      <input type="text" id="email" name="email" required />
      <p aria-live="polite">{state?.message}</p>
      <button disabled={pending}>Sign up</button>
    </form>
  )
}
```

- Prefer **returned values over thrown errors** for expected errors; avoid `try/catch` around
  validation. (`01-app/01-getting-started/10-error-handling.md`)
- Invoking from an event handler needs `startTransition(action)`.
- `useFormStatus()` from `react-dom` gives `pending` in a **child** component of the form.

### Revalidating from an action

```ts
'use server'

import { revalidatePath, revalidateTag, updateTag, refresh } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPost(formData: FormData) {
  // ... mutate ...

  updateTag('posts')                 // read-your-own-writes (Server Actions ONLY)
  // revalidateTag('posts', 'max')   // stale-while-revalidate; note the REQUIRED 2nd arg
  // revalidatePath('/posts')        // path-based
  // refresh()                       // refetch current route RSC payload, no cache invalidation

  redirect('/posts')                 // MUST be last — it throws
}
```

Which one includes a re-render in the same response
(`01-app/02-guides/server-actions.md` § "A single response carries data and UI"):
`updateTag` ✅, `revalidatePath` ✅, `refresh` ✅, cookie set/delete ✅, `redirect` ✅ (navigates),
**`revalidateTag` with a SWR profile ❌** — it deliberately skips the immediate re-render.

### Config

```js
// next.config.js
module.exports = {
  experimental: {
    serverActions: {
      allowedOrigins: ['my-proxy.com', '*.my-proxy.com'],
      bodySizeLimit: '2mb',
    },
  },
}
```

---

## 4. Caching + revalidation, and the R2 pattern

**There are two mutually-exclusive models in 16.3.2.** Pick one per app.

| | Cache Components OFF (this project today) | Cache Components ON |
|---|---|---|
| Flag | — | `cacheComponents: true` (top level) |
| Cache a non-`fetch` function | `unstable_cache(fn, keyParts, { tags, revalidate })` | `'use cache'` + `cacheLife()` + `cacheTag()` |
| Cache a `fetch` | `{ cache: 'force-cache', next: { tags, revalidate } }` | same, or wrap in `use cache` |
| Segment config | `dynamic` / `revalidate` / `fetchCache` / `dynamicParams` work | **all four error** |
| Prerender model | opt-in static | PPR by default; every route emits a static shell |
| Doc | `02-guides/caching-without-cache-components.md` | `01-getting-started/08-caching.md` |

### `use cache` (requires `cacheComponents: true`)

```ts
// next.config.ts
import type { NextConfig } from 'next'
const nextConfig: NextConfig = { cacheComponents: true }
export default nextConfig
```

```tsx
import { cacheLife, cacheTag } from 'next/cache'

export async function getProducts() {
  'use cache'
  cacheLife('hours')
  cacheTag('products')
  return db.query('SELECT * FROM products')
}
```

Placement: file level (`'use cache'` as the first statement — **all exports must be async**),
component level, or function level. Cached functions/components **must be async**.

**Cache key** = build ID (or `deploymentId`) + a hash of the function's location/signature +
serializable arguments + closed-over variables + (dev only) HMR hash.
(`01-app/03-api-reference/01-directives/use-cache.md`)

**Hard constraints:**
- **Cannot call `cookies()`, `headers()`, or read `searchParams`** inside — including transitively via
  a helper. Error: `next-request-in-use-cache`. Read them outside and pass values as arguments.
  `draftMode().isEnabled` **is** readable inside.
- Arguments must be RSC-serializable: primitives, plain objects, arrays, Date/Map/Set/TypedArray/
  ArrayBuffer, React elements as pass-through. **Not:** class instances, functions (except
  pass-through), symbols, WeakMap/WeakSet, **`URL` instances**.
- Return values may additionally include JSX.
- `children` and Server Actions can be passed **through** a cached component as long as you never
  introspect or call them.
- `React.cache` is isolated inside a `use cache` scope — values do not cross the boundary.
- Draft Mode re-executes every cached function and skips writing to the cache.
- **`use cache` cannot be written directly in a Route Handler body.**
- Awaiting a request-scoped promise inside `use cache` during a build **hangs and times out after 50s**.

**Runtime storage caveat that matters on Vercel:**
> "**Serverless**: Cache entries typically don't persist across requests (each request can be a
> different instance), or during revalidation. Build-time caching works normally."
> "For data that needs to persist across deploys, use `unstable_cache` for non-`fetch` functions or
> the `fetch` cache."

Durable options: `'use cache: remote'` (needs a platform/`cacheHandlers.remote` handler; network
roundtrip + platform cost) or letting the result land in prerendered HTML / ISR.

### `cacheLife` profiles

Verified against `dist/server/config-shared.js` (authoritative):

| Profile | `stale` | `revalidate` | `expire` |
|---|---|---|---|
| `default` | 5m (300s) | 15m (900s) | **never** (`INFINITE_CACHE`) |
| `seconds` | 30s | 1s | 60s |
| `minutes` | 5m | 1m (60s) | 1h (3600s) |
| `hours` | 5m | 1h (3600s) | 1d (86400s) |
| `days` | 5m | 1d (86400s) | 1w (604800s) |
| `weeks` | 5m | 1w (604800s) | 30d (2592000s) |
| `max` | 5m | 30d (2592000s) | **1y (31536000s)** |

> ⚠️ The JSDoc in `node_modules/next/dist/cache.d.ts` claims `max` has `expire: never`. The runtime
> config says `60*60*24*365`. **The runtime value (1 year) is correct**; the docs table in
> `01-app/01-getting-started/09-revalidating.md` agrees with the runtime.

Custom, inline:
```ts
'use cache'
cacheLife({ stale: 3600, revalidate: 7200, expire: 86400 })
```
`expire` must be **greater than** `revalidate` or Next.js throws. Pass `Infinity`, not `false`.

Named profiles in config:
```ts
// next.config.ts
const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    content: { stale: 300, revalidate: 2592000, expire: 31536000 },
  },
}
```

**Prerendering thresholds** (`01-app/03-api-reference/04-functions/cacheLife.md` § Prerendering behavior):
- `revalidate: 0`, **or `expire` under 5 minutes** → excluded from prerenders; becomes a dynamic hole.
- `stale` under 30 seconds → excluded from prerenders (a prefetch would expire before the click).
- `stale` 30s–5min → included in prerenders, but **excluded from the route's App Shell**.
- Of the presets, **only `seconds`** trips any of these (its `expire` is 1 minute).

**Nested short-lived caches throw at prerender.** If a short-lived cache is nested inside a `use cache`
scope that has no explicit `cacheLife`, the outer lifetime would silently become short too — Next.js
raises an error instead. The nested cache "could be in an imported module or even a third-party
dependency". Fix by adding `cacheLife('default')` to the outer scope, or making it explicitly
short-lived and wrapping it in `<Suspense>`.

**Nesting propagation rules:**
- Outer scope **with** explicit `cacheLife` → uses its own lifetime, always, longer or shorter.
- Outer scope **without** → uses `default` (15 min). An inner **shorter** cache reduces it; an inner
  **longer** cache cannot extend it past the default.

**Call-site rules:** `cacheLife` cannot be called at module scope (throws). Only **one** call may
execute per function invocation — different control-flow branches are fine.

Client router enforces a **minimum 30-second stale time** regardless of config. The
`x-nextjs-stale-time` response header carries the lifetime server→client. Calling `revalidateTag`,
`revalidatePath`, `updateTag`, or `refresh` from a Server Action **clears the entire client cache
immediately**, bypassing stale time. Changing `experimental.staleTimes.static` also changes the
`default` profile's `stale`.

### `'use cache: remote'` and `'use cache: private'` (both require `cacheComponents`)

| Feature | `use cache` | `'use cache: remote'` | `'use cache: private'` |
|---|---|---|---|
| Server-side storage | in-memory or `cacheHandlers.default` | `cacheHandlers.remote` | **none** |
| Scope | shared across users | shared across users | per-client (browser memory) |
| Can read `cookies()`/`headers()`/`searchParams` | ❌ | ❌ | ✅ |
| Extra cost | none | storage + network + platform fees | none |
| Persists across deploys | ❌ | ❌ | n/a |

(`01-app/03-api-reference/01-directives/use-cache-remote.md` — verbatim table)

- `connection()` is **prohibited in all three**.
- Nesting: remote-in-remote ✅, remote-in-regular ✅, **remote-in-private ❌**, **private-in-remote ❌**.
- `'use cache: private'` is **not available in Route Handlers**; it executes on every server render and
  never joins the static shell. Its `stale` must be ≥30s for runtime prefetching and ≥5min to reach the
  App Shell.
- `'use cache: remote'` is worth its latency only at a **high hit rate**. The docs say to avoid it when
  cache keys are near-unique per request, when the upstream is already <50ms, or when data changes
  every few seconds.

```ts
async function getRecommendations(productId: string) {
  'use cache: private'
  cacheTag(`recommendations-${productId}`)
  cacheLife({ stale: 60 })
  const sessionId = (await cookies()).get('session-id')?.value || 'guest'
  return getPersonalizedRecommendations(productId, sessionId)
}
```

### `cacheTag`

```ts
import { cacheTag } from 'next/cache'

export async function getData() {
  'use cache'
  cacheTag('my-data')                 // 1..128 tags per call, ≤256 chars each
  cacheTag('tag-one', 'tag-two')      // variadic
  return fetch('/api/data')
}
```
Over-long tags are **skipped**; tags past the 128th in one call are **dropped**; both log a warning.
Tags may be derived from fetched data (`cacheTag('bookings', data.id)`) as long as `cacheTag` is
called inside the same cached scope.

### Previous model (no `cacheComponents`) — `unstable_cache`

```ts
// app/lib/data.ts
import { unstable_cache } from 'next/cache'

export const getCachedUser = unstable_cache(
  async (id: string) => db.select().from(users).where(eq(users.id, id)).then((r) => r[0]),
  ['user'],                       // keyParts — cache-key prefix
  { tags: ['user'], revalidate: 3600 }
)
```
- `keyParts` supplements the auto key (arguments + stringified function). Required only when the
  function closes over external variables it doesn't take as parameters.
- `revalidate: false` (or omitted) → cache indefinitely until `revalidateTag`/`revalidatePath`.
- **Cannot read `headers()`/`cookies()` inside.**
- "This API uses Next.js' built-in cache to persist the result across requests **and deployments**."

`fetch`-based tagging:
```ts
await fetch('https://...', { cache: 'force-cache', next: { tags: ['user'], revalidate: 3600 } })
```
Max 128 tags, 256 chars each. Conflicting `{ revalidate: 3600, cache: 'no-store' }` is **ignored**
(both), with a dev warning.

### Per-render dedup (both models)

```ts
import { cache } from 'react'
import 'server-only'

export const getPost = cache(async (id: string) => db.query.posts.findFirst({ where: eq(posts.id, id) }))
```
`fetch` GET requests with identical URL+options are memoized automatically for one render pass
(**not** in Route Handlers).

### ⭐ Recommended pattern for this project: JSON in R2, tag-invalidated after admin writes

Constraints: reads go through `@aws-sdk/client-s3` (**not `fetch`**, so no `next.tags`); public pages
read on every render; admin writes happen in **Route Handlers** (`/api/save`), not Server Actions;
`cacheComponents` is off; deployed to Vercel (serverless).

**Do this (minimal, matches the current config):**

```ts
// src/lib/store.ts
import 'server-only'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { getObject } from './r2'

export const CONTENT_TAG = 'content'

/** Durable, cross-request, cross-deploy cache. Invalidated only by tag. */
const readProjectsCached = unstable_cache(
  async () => {
    const { body } = await getObject('data/projects.json')
    return JSON.parse(new TextDecoder().decode(body)) as ProjectsFile
  },
  ['projects-json'],            // keyParts: the fn takes no args, so this IS the key
  { tags: [CONTENT_TAG], revalidate: false }   // false = until invalidated
)

/** React.cache dedupes within a single render pass on top of the persistent cache. */
export const readProjects = cache(readProjectsCached)
```

```ts
// app/api/save/route.ts  — admin write
import { revalidateTag } from 'next/cache'
import { CONTENT_TAG } from '@/lib/store'

export async function POST(request: Request) {
  // ... auth + Origin check + conditional PUT to R2 ...

  // Route Handler => updateTag() is NOT available. Use { expire: 0 } for
  // immediate expiry so the admin sees their own write on the next read.
  revalidateTag(CONTENT_TAG, { expire: 0 })

  return Response.json({ ok: true })
}
```

Why exactly this:
- `unstable_cache` is the **only** documented non-`fetch` caching primitive that works without
  `cacheComponents` and that the docs say persists "across requests and deployments".
- `revalidateTag` **requires** a second argument in 16 — `revalidateTag('content')` alone is a
  TS error. `{ expire: 0 }` is the documented form for immediate expiry from a Route Handler:
  > "For webhooks or third-party services that need immediate expiration, you can pass `{ expire: 0 }`
  > as the second argument … This pattern is necessary when external systems call your Route Handlers
  > and require data to expire immediately."
  > (`01-app/03-api-reference/04-functions/revalidateTag.md`)
  Use `'max'` instead if a few seconds of staleness after a save is acceptable.
- `updateTag('content')` would be better (immediate + same-roundtrip re-render) but it **throws
  outside a Server Action**. If the admin save is converted to a Server Action, switch to `updateTag`.
- `revalidateTag` **cannot be called from `proxy.ts`**.

**If you later enable `cacheComponents: true`,** the same shape becomes:

```ts
// src/lib/store.ts
import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { getObject } from './r2'

export const CONTENT_TAG = 'content'

export async function readProjects() {
  'use cache'
  cacheLife('max')          // content changes only on admin write
  cacheTag(CONTENT_TAG)
  const { body } = await getObject('data/projects.json')
  return JSON.parse(new TextDecoder().decode(body)) as ProjectsFile
}
```
Then in a **Server Action**: `updateTag(CONTENT_TAG)`; in a **Route Handler**:
`revalidateTag(CONTENT_TAG, 'max')`.

Cost of enabling `cacheComponents`, so this is an eyes-open decision:
- `export const dynamic | revalidate | fetchCache | dynamicParams` become **build errors**.
- `generateStaticParams` must return ≥ 1 param.
- Uncached data or runtime APIs outside `<Suspense>` become build/dev errors.
- `new Date()`, `Date.now()`, `Math.random()`, `crypto.randomUUID()` during prerender throw.
- Node.js runtime required.
- Escape hatch: `export const instant = false`; bulk codemod
  `npx @next/codemod@canary cache-components-instant-false ./app`.

**Do NOT** use `revalidatePath` here — the docs say to prefer tags: "it's more precise and avoids
over-invalidating." (`01-app/01-getting-started/09-revalidating.md`)

---

## 5. `next/image` with a remote CDN host

### Config

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
        port: '',
        pathname: '/media/**',
        search: '',
      },
    ],
    // v16 default is [75]; a `quality` prop outside this list is silently coerced
    qualities: [75],
    // v16 default is 14400 (4h)
    minimumCacheTTL: 14400,
    formats: ['image/webp'],
  },
}

export default nextConfig
```

`URL` shorthand also works (added v15.3.0):
```js
images: { remotePatterns: [new URL('https://cdn.example.com/media/**')] }
```

Wildcards: `*` = one path segment or subdomain; `**` = any number of trailing path segments or leading
subdomains. **`**` does not work in the middle of a pattern.** Omitting `protocol`/`port`/`pathname`/
`search` implies `**` — "not recommended".

⚠️ **Redirects from an allowed host are NOT re-validated against `remotePatterns`.** Limit with
`images.maximumRedirects` (v16 default `3`; `0` disables).
(`01-app/03-api-reference/02-components/image.md`)

⚠️ **If you use a custom `loader` / `loaderFile`, `/_next/image` is bypassed entirely** and
`remotePatterns` is not consulted — the loader's returned URL is used directly. Configure the loader in
`next.config.ts` rather than as a prop where possible; a `loader` **prop** requires a Client Component
because the function must be serialized.

### Remote image markup

```tsx
import Image from 'next/image'

// Fixed size — width/height are the intrinsic ratio, not the rendered size
<Image
  src="https://cdn.example.com/media/photo.webp"
  alt="Ehitusobjekt"
  width={1200}
  height={800}
  sizes="(max-width: 768px) 100vw, 50vw"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQ..."   // REQUIRED for remote + blur
/>
```

```tsx
// Responsive, ratio-preserving — the doc's own CLS-safe shape
<Image
  src={photoUrl}
  alt="Picture of the author"
  sizes="100vw"
  style={{ width: '100%', height: 'auto' }}
  width={500}
  height={300}
/>
```

```tsx
// Unknown dimensions — fill. Parent MUST be positioned.
<div style={{ position: 'relative', aspectRatio: '3 / 2' }}>
  <Image
    src={photoUrl}
    alt="Ehitusobjekt"
    fill
    sizes="(max-width: 768px) 100vw, 33vw"
    style={{ objectFit: 'cover' }}
  />
</div>
```

### Prop semantics (defaults from doc code comments / runtime source)

| Prop | Default | Notes |
|---|---|---|
| `src` | — | **required** |
| `alt` | — | **required** |
| `width` / `height` | — | required **unless** static import or `fill` |
| `fill` | `false` | parent needs `position: relative \| fixed \| absolute` |
| `sizes` | — | required with `fill` or CSS-responsive images; without it the browser assumes `100vw` |
| `quality` | `75` | must be in `images.qualities` or it is coerced to the nearest allowed |
| `preload` | `false` | **v16 replacement for `priority`** |
| `priority` | `false` | **deprecated in v16** |
| `loading` | `'lazy'` | `'lazy' \| 'eager'` |
| `placeholder` | `'empty'` | `'empty' \| 'blur' \| 'data:image/...'` |
| `blurDataURL` | — | auto only for **static imports** of jpg/png/webp/avif (non-animated); **manual for all remote images** |
| `unoptimized` | `false` | serve as-is; auto for `src` ending `.svg` |
| `decoding` | `'async'` | `'async' \| 'sync' \| 'auto'` |
| `overrideSrc` | — | keeps a fixed `src` attribute while `srcset` is still generated (SEO/migration) |
| `onLoad`, `onError` | — | require a Client Component |
| `fetchPriority` | — | passes through to `<img>`; **not documented as a prop** |

`sizes` also changes what gets generated: without it Next.js emits a limited 1x/2x `srcset`; with it,
the full width-descriptor `srcset`.

### Avoiding CLS

1. Always give intrinsic `width`+`height` (ratio) **or** `fill` inside a fixed-ratio parent.
   > "The `width` and `height` attributes are used to infer the correct aspect ratio of image and avoid
   > layout shift from the image loading in. The `width` and `height` do _not_ determine the rendered
   > size of the image file."
2. If you set width via `style`/CSS, also set **`height: 'auto'`** to preserve the ratio.
3. Use `placeholder="blur"` + a tiny (≤10px) `blurDataURL`; large blur data URLs hurt performance.
4. `preload` (or `fetchPriority="high"`) for the LCP hero only — never for several candidates.
5. Don't use `styled-jsx` for image styles unless marked `global`.

---

## 6. Metadata

### `generateMetadata`

```tsx
// app/tood/[slug]/page.tsx
import type { Metadata, ResolvingMetadata } from 'next'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params
  const project = await getProject(slug)
  const previousImages = (await parent).openGraph?.images || []

  return {
    title: project.title,
    openGraph: { images: [`/tood/${slug}/opengraph-image`, ...previousImages] },
  }
}
```
`params` is typed with `PageProps<'/route'>` / `LayoutProps<'/route'>` too.
Rules: Server Components only; **cannot export both `metadata` and `generateMetadata`** from one
segment; `searchParams` only in `page.js`; `fetch` is memoized with the page's own fetches;
`redirect()`/`notFound()` may be called inside; **file-based metadata overrides both**.
(`01-app/03-api-reference/04-functions/generate-metadata.md`)

Streaming: resolved metadata tags are appended to **`<body>`**; HTML-limited bots (configured via
`htmlLimitedBots`) get them blocked into `<head>` instead.

### `metadataBase`, canonical, hreflang

```ts
// app/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://mphmeistrid.ee'),
  alternates: {
    canonical: '/',
    languages: {
      et: '/',
      ru: '/ru',
      'x-default': '/',
    },
  },
  openGraph: { images: '/opengraph-image' },
}
```
- Applies to the **current segment and below**; a relative URL in any URL-valued metadata field
  without a `metadataBase` is a **build error**; an absolute URL ignores `metadataBase`.
- URL composition "favors developer intent": with `metadataBase = https://acme.com`, all of `/`, `./`,
  `payments`, `/payments`, `./payments`, `../payments` resolve as expected (no directory traversal).
- `x-default` is a valid `languages` key
  (`dist/lib/metadata/types/alternative-urls-types.d.ts`: `UnmatchedLang = 'x-default'`).

Emits:
```html
<link rel="canonical" href="https://mphmeistrid.ee" />
<link rel="alternate" hreflang="et" href="https://mphmeistrid.ee/" />
<link rel="alternate" hreflang="ru" href="https://mphmeistrid.ee/ru" />
```

### openGraph / twitter

```ts
export const metadata: Metadata = {
  openGraph: {
    title: 'MPH Meistrid',
    description: '...',
    url: 'https://mphmeistrid.ee',
    siteName: 'MPH Meistrid',
    images: [{ url: 'https://mphmeistrid.ee/og.png', width: 1200, height: 630, alt: '...' }],
    locale: 'et_EE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MPH Meistrid',
    description: '...',
    images: ['https://mphmeistrid.ee/og.png'],
  },
}
```
`type` union: `'article' | 'book' | 'music.song' | 'music.album' | 'music.playlist' |
'music.radio_station' | 'profile' | 'website' | 'video.tv_show' | 'video.other' | 'video.movie' |
'video.episode'`. `type: 'article'` unlocks `publishedTime`, `modifiedTime`, `expirationTime`,
`authors`, `section`, `tags`. Twitter cards: `'summary' | 'summary_large_image' | 'player' | 'app'`.

### `sitemap.ts`

```ts
// app/sitemap.ts
import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://mphmeistrid.ee',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
      alternates: { languages: { et: 'https://mphmeistrid.ee', ru: 'https://mphmeistrid.ee/ru' } },
    },
  ]
}
```

Full field set (from `dist/lib/metadata/types/metadata-interface.d.ts` — the docs' `Returns` block is
**stale** and omits `images`/`videos`):
```ts
type SitemapFile = Array<{
  url: string
  lastModified?: string | Date
  changeFrequency?: 'always'|'hourly'|'daily'|'weekly'|'monthly'|'yearly'|'never'
  priority?: number
  alternates?: { languages?: Languages<string> }
  images?: string[]                 // plain URL strings
  videos?: Videos[]                 // { title, thumbnail_loc, description, ... }
}>
```
`sitemap.ts` is a Route Handler that is **cached by default** unless it uses a request-time API or a
dynamic config option. A literal `app/sitemap.xml` also works.

`generateSitemaps` — **v16: `id` is a Promise**:
```ts
export async function generateSitemaps() {
  return [{ id: 0 }, { id: 1 }]
}

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const id = await props.id
  const start = Number(id) * 50000
  // ...
}
```
Output URLs: `/product/sitemap/1.xml`.

### `robots.ts`

```ts
// app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/admin/' },
    sitemap: 'https://mphmeistrid.ee/sitemap.xml',
  }
}
```
Type:
```ts
type Robots = {
  rules:
    | { userAgent?: string | string[]; allow?: string | string[]; disallow?: string | string[]
      ; crawlDelay?: number; other?: Record<string, string | number | Array<string | number>> }
    | Array<{ userAgent: string | string[]; /* ...same, userAgent REQUIRED... */ }>
  sitemap?: string | string[]
  host?: string
}
```
**`other` is new in v16.3.0** — non-standard per-agent directives, passed through verbatim, unvalidated
(e.g. `{ 'Request-Rate': '10/1m' }`).

### `opengraph-image.tsx`

```tsx
// app/opengraph-image.tsx
import { ImageResponse } from 'next/og'

export const alt = 'MPH Meistrid'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{ fontSize: 96, background: '#fff', width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        MPH Meistrid
      </div>
    ),
    { ...size }
  )
}
```
With a dynamic segment, **`params` is a Promise in v16**:
```tsx
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  // ...
}
```
- Import `ImageResponse` from **`next/og`** (also re-exported from `next/server`).
- Config exports: `alt` (string), `size` (`{width, height}`), `contentType` (MIME).
- Default export must return a `Response`; `ImageResponse` satisfies it.
- Read local font/image assets at **module scope**, not inside the handler.
- Static file variants: `.jpg/.jpeg/.png/.gif` + a sibling `opengraph-image.alt.txt`.
  Size caps: **opengraph-image ≤ 8 MB, twitter-image ≤ 5 MB** — exceeding them **fails the build**.
- `generateImageMetadata` → image function also gets `id: Promise<string | number>`.

### `icon` / `apple-icon`

| Convention | Types | Location |
|---|---|---|
| `favicon` | `.ico` | **`app/` root only** |
| `icon` | `.ico`, `.jpg`, `.jpeg`, `.png`, `.svg` | `app/**/*` |
| `apple-icon` | `.jpg`, `.jpeg`, `.png` | `app/**/*` |

Generated tags:
```html
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" href="/icon?<generated>" type="image/<generated>" sizes="<generated>" />
<link rel="apple-touch-icon" href="/apple-icon?<generated>" type="image/<generated>" sizes="<generated>" />
```
Multiple icons: `icon1.png`, `icon2.png`, … (sorted lexically). `sizes="any"` is added for `.svg` or
when size can't be determined. Code-generated `icon.tsx` supports **only `size` and `contentType`**
(no `alt`). **You cannot generate a `favicon`.**

### JSON-LD

There is **no Next.js helper**. The documented pattern
(`01-app/02-guides/json-ld.md`):

```tsx
export default async function Page({ params }: PageProps<'/tood/[slug]'>) {
  const { slug } = await params
  const project = await getProject(slug)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: project.name,
    image: project.image,
    description: project.description,
  }

  return (
    <section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      {/* ... */}
    </section>
  )
}
```
The `.replace(/</g, '\\u003c')` is **required** — `JSON.stringify` does not sanitize XSS payloads.
Use a plain `<script>`, **not** `next/script`: "Since JSON-LD is structured data, not executable code,
a native `<script>` tag is the right choice here." Optional typing via the community `schema-dts`.

### `generateViewport`

Separate from metadata because "viewport **cannot be streamed** because it affects initial page load
UI." (`01-app/03-api-reference/04-functions/generate-viewport.md`)

```tsx
import type { Viewport } from 'next'

export const viewport: Viewport = {
  themeColor: 'black',
  width: 'device-width',
  initialScale: 1,
}
```
`themeColor`, `colorScheme`, and `viewport` inside `metadata` are **deprecated since Next 14**.
Codemod: `metadata-to-viewport-export`. There is **no `parent` argument**.

---

## 7. `proxy.ts` (the renamed middleware)

### Exact signature

```ts
// proxy.ts  (project root or src/, same level as app/)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  return NextResponse.redirect(new URL('/home', request.url))
}

export const config = {
  matcher: '/about/:path*',
}
```

- Named `proxy` export **or** a default export. Only one function per file; multiple proxies are not
  supported. Docs recommend naming the function `proxy` even with a default export.
- Async is allowed.
- Shorthand type that infers both params:
  ```ts
  import type { NextProxy } from 'next/server'
  export const proxy: NextProxy = (request, event) => {
    event.waitUntil(Promise.resolve())
    return Response.json({ pathname: request.nextUrl.pathname })
  }
  ```
  `NextProxy = (request: NextRequest, event: NextFetchEvent) => NextResponse | Response | null | undefined | void | Promise<...>`
  (`dist/server/web/types.d.ts`)
- **Runtime is `nodejs` and is not configurable.** `export const runtime` throws.
- `fetch` with `options.cache` / `next.revalidate` / `next.tags` **has no effect in Proxy**.
- **`revalidateTag` cannot be called in Proxy.**

### `config.matcher`

```ts
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
```
- **Without a matcher, Proxy runs on EVERY request** — including `_next/static`, `_next/image`, and
  `public/` assets. Omitting it will break CSS/JS/images behind auth logic.
- Values must be **statically analyzable constants** — variables are ignored.
- Object form:
  ```ts
  export const config = {
    matcher: [
      {
        source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
        locale: false,
        has: [{ type: 'header', key: 'Authorization', value: 'Bearer Token' }],
        missing: [{ type: 'cookie', key: 'session', value: 'active' }],
      },
    ],
  }
  ```
- Source patterns must start with `/`; `:path` = one segment, `:path*` = zero+, `:path?` = zero/one,
  `:path+` = one+; `(.*)` regex allowed; anchored to the start of the path.
- **`_next/data/*` always runs Proxy**, even when excluded by a negative matcher. Intentional, to avoid
  protecting a page but not its data route.
- `/public` is treated as `/public/index` for backwards compat.

### Execution order

1. `headers` from `next.config` → 2. `redirects` from `next.config` → 3. **Proxy** →
4. `beforeFiles` rewrites → 5. filesystem routes → 6. `afterFiles` rewrites → 7. dynamic routes →
8. `fallback` rewrites.

> **Server Functions are not separate routes in this chain.** They are POSTs to the route where they
> are used, so a matcher that excludes a path **also skips Server Function calls on that path**.
> Always authorize inside each Server Function.

### Cookies

```ts
export function proxy(request: NextRequest) {
  // Request cookies (RequestCookies API)
  const cookie = request.cookies.get('nextjs')     // { name, value, Path }
  request.cookies.getAll()
  request.cookies.has('nextjs')                    // boolean
  request.cookies.delete('nextjs')
  request.cookies.clear()                          // request only

  // Response cookies (ResponseCookies API)
  const response = NextResponse.next()
  response.cookies.set('vercel', 'fast')
  response.cookies.set({ name: 'vercel', value: 'fast', path: '/' })
  response.cookies.get('vercel')
  response.cookies.delete('vercel')
  return response
}
```
Request cookies: `get`, `getAll`, `set`, `delete`, `has`, `clear`.
Response cookies: `get`, `getAll`, `set`, `delete`.

### Setting headers

```ts
export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-hello-from-proxy1', 'hello')

  const response = NextResponse.next({
    request: { headers: requestHeaders },   // ← forwards to the app
  })

  response.headers.set('x-hello-from-proxy2', 'hello')   // ← visible to the client
  return response
}
```
`NextResponse.next({ request: { headers } })` sets **request** headers.
`NextResponse.next({ headers })` sets **response** headers. These are not the same thing.
Avoid large headers (HTTP 431).

**RSC requests:** Next.js strips internal Flight headers (`rsc`, `next-router-state-tree`,
`next-router-prefetch`) from `request.headers`. `NextResponse.rewrite()` propagates the required RSC
headers automatically; a hand-rolled `fetch()` rewrite does not — forward them manually or set
`skipProxyUrlNormalize: true`.

### Redirecting / responding directly

```ts
return NextResponse.redirect(new URL('/login', request.url))
return NextResponse.rewrite(new URL('/about-2', request.url))
return Response.json({ success: false }, { status: 401 })   // respond directly
return NextResponse.next()                                   // continue
```
`Response.redirect` also works for redirects.

### Composing with `next-intl`

`next-intl` 4.13.7 has **no `proxy` export**. The import path is still `next-intl/middleware`, and
`createMiddleware(routing)` returns `(request: NextRequest) => NextResponse<unknown>` — verified in
`node_modules/next-intl/dist/types/middleware/middleware.d.ts`. Only the **Next.js file/export name**
changes. Wrap it:

```ts
// src/proxy.ts
import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { routing } from '@/i18n/routing'

const handleI18n = createMiddleware(routing)

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl

  // 1) Admin: optimistic cookie check only. NOT the authorization boundary.
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!request.cookies.has('mph_session')) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    // Admin is not localized — skip next-intl entirely.
    return NextResponse.next()
  }

  // 2) Everything else: let next-intl own locale routing and its response.
  return handleI18n(request)
}

export const config = {
  matcher: [
    // Exclude API, Next internals and files with an extension.
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)',
  ],
}
```

Rules for composing:
- **Return `next-intl`'s response object**, don't rebuild it — it carries locale rewrites, `Link`
  alternates and (when enabled) the locale cookie.
- If you need to add headers on top, mutate `handleI18n(request).headers` on the returned response.
- The matcher must still let localized paths through; `next-intl`'s own docs recommend a matcher that
  covers `/` and all locale-prefixed paths.
- `localeDetection: false` + `localeCookie: false` (this project's `routing.ts`) means `next-intl`
  never reads `Accept-Language` and sets no cookie — the proxy is pure path rewriting.

Next.js's own locale-detection example, for reference
(`01-app/02-guides/internationalization.md`), also uses `export function proxy(request)` in `proxy.js`.

### Advanced flags

```js
// next.config.js
module.exports = {
  skipProxyUrlNormalize: true,   // was skipMiddlewareUrlNormalize
  skipTrailingSlashRedirect: true,
}
```

### Testing

```js
import { unstable_doesProxyMatch, isRewrite, getRewrittenUrl } from 'next/experimental/testing/server'

expect(unstable_doesProxyMatch({ config, nextConfig, url: '/test' })).toEqual(false)
```

---

## 8. Cookies (auth-adjacent)

`cookies()` is **async** — `await` it. Import from `next/headers`.

```ts
import { cookies } from 'next/headers'

const cookieStore = await cookies()
```

### Full method surface

| Method | Returns | Notes |
|---|---|---|
| `get('name')` | `{ name, value, ... } \| undefined` | |
| `getAll()` / `getAll('name')` | array | no arg → all cookies |
| `has('name')` | `boolean` | |
| `set(name, value, options)` | — | also `set({ name, value, ...options })` |
| `delete('name')` | — | Server Function / Route Handler only |
| `toString()` | `string` | |

### All `set` options

| Option | Type | Notes |
|---|---|---|
| `name` | string | |
| `value` | string | |
| `expires` | `Date` | absolute expiry |
| `maxAge` | number | **seconds**; `0` expires immediately |
| `domain` | string | |
| `path` | string | **the only option with a default: `'/'`** |
| `secure` | boolean | HTTPS only |
| `httpOnly` | boolean | blocks client-side JS access |
| `sameSite` | `boolean \| 'lax' \| 'strict' \| 'none'` | |
| `priority` | `'low' \| 'medium' \| 'high'` | |
| `partitioned` | boolean | CHIPS |

(`01-app/03-api-reference/04-functions/cookies.md`)

### Where you CAN and CANNOT set cookies

| Context | read | set / delete |
|---|---|---|
| Server Component (page/layout) | ✅ | ❌ |
| Server Function / Server Action | ✅ | ✅ |
| Route Handler | ✅ | ✅ |
| `proxy.ts` | ✅ (`request.cookies`) | ✅ (`response.cookies`) |
| Client Component | ❌ | ❌ (use `document.cookie` or an action) |
| Inside `use cache` | ❌ **throws** | ❌ |

Verbatim reasons (`01-app/03-api-reference/04-functions/cookies.md`):
> "**Setting cookies** is not supported during Server Component rendering. To modify cookies, invoke a
> Server Function from the client or use a Route Handler."
> "HTTP does not allow setting cookies after streaming starts, so you must use `.set` in a Server
> Function or Route Handler."
> "The `.delete` method can only be called: In a Server Function or Route Handler. If it belongs to the
> same domain from which `.set` is called … the code must be executed on the same protocol."

Also: "Next.js explicitly prevents setting cookies or triggering cache revalidation within render
methods to avoid unintended side effects." (`01-app/02-guides/data-security.md`)

### Documented session-cookie pattern

```ts
// app/lib/session.ts
import 'server-only'
import { cookies } from 'next/headers'

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const session = await encrypt({ userId, expiresAt })
  const cookieStore = await cookies()

  cookieStore.set('session', session, {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}
```
(`01-app/02-guides/authentication.md`) — the App Router example uses **`expires`**, not `maxAge`.
Deleting: `cookieStore.delete('session')`, or `set('name', 'value', { maxAge: 0 })`.

**After a Server Action sets/deletes a cookie, Next.js re-renders the current page and its layouts in
the same roundtrip** so the UI reflects the new value. Client state is preserved for re-rendered
components; effects re-run if deps changed. It does **not** revalidate cached data — call
`revalidateTag`/`revalidatePath` for that.

### Data Access Layer pattern

```ts
// app/lib/dal.ts
import 'server-only'
import { cache } from 'react'          // NOTE: the doc's example omits this import — it is required
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { decrypt } from '@/app/lib/session'

export const verifySession = cache(async () => {
  const cookie = (await cookies()).get('session')?.value
  const session = await decrypt(cookie)
  if (!session?.userId) redirect('/login')
  return { isAuth: true, userId: session.userId }
})
```
- `import 'server-only'` makes a client import a **build error**.
- `cache()` dedupes the check within one render pass.
- Client Components cannot import the DAL.
- A top-level `await` on `cookies()`/`headers()`/the DAL **in a layout** delays the first streamed
  chunk and holds `{children}` behind it.
- Returning `null` from a layout for unauthorized users is **explicitly not recommended** — it does not
  stop nested segments or Server Actions from executing.

---

## 9. `next.config.ts`

### Typing

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* ... */
}

export default nextConfig
```
- Module resolution in `next.config.ts` is limited to **CommonJS**; ESM / top-level `await` /
  dynamic `import()` require Node's native TS resolver. Use `next.config.mts` for ESM.
  `.cjs` / `.cts` are **not supported**.
- `next typegen` (also run by `next dev` / `next build`) generates the **globally available**
  `PageProps`, `LayoutProps`, `RouteContext` helpers into `<distDir>/types` and refreshes
  `next-env.d.ts`. `tsconfig.json` `include` must contain `.next/types/**/*.ts`.

### The keys this project needs

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // --- security ---
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
        ],
      },
    ]
  },

  async redirects() {
    return [
      { source: '/vana-url', destination: '/', permanent: true },   // permanent:true = 308, false = 307
    ]
  },

  // --- images ---
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.example.com', port: '', pathname: '/media/**', search: '' },
    ],
    qualities: [75],
    minimumCacheTTL: 14400,
  },

  // --- server-only deps ---
  serverExternalPackages: ['@aws-sdk/client-s3', 'sharp'],

  // --- caching model (see §4) ---
  // cacheComponents: true,
}

export default nextConfig
```

Notes:
- **`headers()` and `redirects()` may be sync or async.** Every doc example uses the bare
  `headers() { ... }` form; the prose says "can be defined as a synchronous or async function".
  Both work. (`05-config/01-next-config-js/headers.md`, `redirects.md`)
- `headers`/`redirects` entries also accept `basePath: false`, `locale: false`, and `has`/`missing`
  arrays with `type: 'header' | 'cookie' | 'host' | 'query'`. Named capture groups in `has[].value`
  are usable as `:paramName` in the header value.
- `redirects` supports `statusCode` **or** `permanent`, never both.
- **The docs contain no consolidated `securityHeaders` array example** — the header list above is
  assembled from the individual fragments in `headers.md`. The v16 doc notes `X-Frame-Options`
  "has been superseded by CSP's `frame-ancestors` option".
- `poweredByHeader: false` removes `X-Powered-By`.
- `serverExternalPackages` opts packages out of the Server Components bundling. ~80 packages
  (including `sharp` and `@aws-sdk/*` families) are auto-externalized already — check the doc's list
  before adding.
- `cacheComponents: true` is the **only** flag needed for `use cache` / `cacheLife` / `cacheTag` /
  `prefetch` / `instant`. It is **top-level, not experimental**, and replaces `experimental.ppr`,
  `experimental.dynamicIO`, and `experimental.useCache`.
- Optional companions: `cacheLife: { <name>: { stale, revalidate, expire } }` for custom profiles;
  `cacheHandlers: { default, remote }` for durable `use cache` storage (v16.0.0);
  `partialPrefetching: true` (16.3.0, **requires `cacheComponents`** or config validation throws).
- Distinct key, easy to confuse: **`cacheHandler`** (singular, `require.resolve(...)`) is the ISR /
  Route-Handler / image cache handler and is **not** used by `use cache`. **`cacheHandlers`** (plural)
  is the `use cache` one.
- `experimental.authInterrupts: true` is required for `forbidden()` / `unauthorized()`.
- `experimental.taint: true` enables `experimental_taintObjectReference` / `experimental_taintUniqueValue`.
- `experimental.globalNotFound: true` enables `app/global-not-found.tsx`.

### CSP with a nonce

`proxy.ts` (`01-app/02-guides/content-security-policy.md` — this is verbatim v16):

```ts
// proxy.ts
import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const isDev = process.env.NODE_ENV === 'development'
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''};
    style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`};
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`
  const contentSecurityPolicyHeaderValue = cspHeader.replace(/\s{2,}/g, ' ').trim()

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', contentSecurityPolicyHeaderValue)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', contentSecurityPolicyHeaderValue)
  return response
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
```
- Next.js parses the CSP header and applies the nonce **automatically** to framework scripts, page
  bundles, its own inline styles/scripts, and `<Script nonce={...}>`. You read it with
  `(await headers()).get('x-nonce')`.
- ⚠️ **Nonce-based CSP forces dynamic rendering for every page**: static optimization and ISR are
  disabled, CDN caching needs extra work, and **PPR is incompatible** with it.
- CSP **without** nonces goes in `next.config` `headers()` with `'unsafe-inline'`, and keeps static
  rendering. There is also experimental `experimental.sri.algorithm: 'sha256' | 'sha384' | 'sha512'`
  (App Router only, build-time hashes) as a middle ground.

---

## 10. Error handling

### `error.tsx`

```tsx
// app/tood/error.tsx
'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div>
      <h2>Midagi läks valesti</h2>
      <button onClick={() => retry()}>Proovi uuesti</button>
    </div>
  )
}
```
- Props: `error` (`Error & { digest?: string }`), **`retry: () => void`** (stable in v16.3.0), and
  legacy **`reset: () => void`** (still passed, undocumented in v16, does not recover Server
  Component errors).
- Wraps `loading.js`, `not-found.js`, `page.js`, and nested `layout.js`. It does **not** wrap the
  `layout.js`/`template.js` in its own segment.
- In production, Server Component error messages are replaced with a generic message + `error.digest`;
  match that digest against server logs.
- Does not catch event-handler errors. Errors thrown inside `startTransition` **do** bubble up.

### `global-error.tsx`

```tsx
// app/global-error.tsx
'use client'

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <html>
      <body>
        <h2>Midagi läks valesti</h2>
        <button onClick={() => retry()}>Proovi uuesti</button>
      </body>
    </html>
  )
}
```
Must define its own `<html>` and `<body>` — it replaces the root layout. Also displayed in
development since v15.2.0. Works with i18n.

### `catchError` — component-level boundaries (new)

```tsx
// app/custom-error-boundary.tsx
'use client'

import { catchError, type ErrorInfo } from 'next/error'

function ErrorFallback(props: { title: string }, { error, retry }: ErrorInfo) {
  return (
    <div>
      <h2>{props.title}</h2>
      <p>{error.message}</p>
      <button onClick={() => retry()}>Try again</button>
    </div>
  )
}

export default catchError(ErrorFallback)
```
```tsx
import ErrorBoundary from './custom-error-boundary'
export default function Component({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary title="Dashboard Error">{children}</ErrorBoundary>
}
```
- Import from **`next/error`** (`dist/error.d.ts` exports `catchError` and type `ErrorInfo`).
  Version history: `` v16.3.0 | catchError became stable. `` / `` v16.2.0 | unstable_catchError introduced. ``
- `errorInfo` = `{ error: Error; retry: () => void; reset: () => void }`.
- `retry()` re-renders inside a Transition, preserving Client state outside the boundary.
- It deliberately **does not swallow** `redirect()` / `notFound()` control-flow errors.
- Error state clears automatically on client navigation to a different route.
- The fallback must be a Client Component.

### `not-found.tsx` + `notFound()`

```tsx
// app/tood/[slug]/page.tsx
import { notFound } from 'next/navigation'

export default async function Page({ params }: PageProps<'/tood/[slug]'>) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()
  return <div>{post.title}</div>
}
```
```tsx
// app/tood/[slug]/not-found.tsx
export default function NotFound() {
  return <div>404</div>
}
```
- Signature `notFound(): never`. Throws `NEXT_HTTP_ERROR_FALLBACK;404` and injects
  `<meta name="robots" content="noindex" />`.
- Status code: **`404` for non-streamed responses, `200` for streamed responses.** Once streaming has
  started the status cannot change — do the check in `proxy.ts` if you need a real 404.
  In a Route Handler it serves a real `404`.
- Callable in Server Components, Server Functions, and Route Handlers.
- A `try/catch` around it **suppresses** the interrupt and no not-found UI renders — use
  `unstable_rethrow`. A call left in an un-awaited promise logs
  `⨯ unhandledRejection: NEXT_HTTP_ERROR_FALLBACK;404` and renders nothing. Always `await`.
- `not-found.js` renders between `loading.js` and `page.js`.
- `app/global-not-found.tsx` (**experimental**, v15.4.0, needs `experimental.globalNotFound: true`)
  handles URLs that match no route at all. It bypasses your layout, so it must import its own global
  CSS, fonts, and theme, and render `<html>`/`<body>` itself.

### `forbidden()` / `unauthorized()` — they exist, but are experimental

Both are **present** in 16.3.2 (`next/navigation`), introduced in v15.1.0, still flagged
`version: experimental`. **Require an opt-in:**

```ts
// next.config.ts
const nextConfig: NextConfig = {
  experimental: { authInterrupts: true },
}
```

```tsx
import { forbidden, unauthorized } from 'next/navigation'

export default async function AdminPage() {
  const session = await verifySession()
  if (!session) unauthorized()        // -> 401, renders unauthorized.tsx
  if (session.role !== 'admin') forbidden()  // -> 403, renders forbidden.tsx
  return <></>
}
```
File conventions: `app/**/forbidden.tsx`, `app/**/unauthorized.tsx`.

- Callable in Server Components, Server Functions, and Route Handlers.
- **Cannot be called in the root layout.**
- They throw (`NEXT_HTTP_ERROR_FALLBACK;403` / `;401`) and return `never` — never write
  `return forbidden()`.
- A `try/catch` around the call **suppresses the interrupt** and no UI renders. Use
  `unstable_rethrow` to let it through.
- A call inside an un-awaited promise throws where nothing catches it; dev logs
  `⨯ unhandledRejection: NEXT_HTTP_ERROR_FALLBACK;401`. Always `await`.
- Next.js injects `<meta name="robots" content="noindex" />`.
- **Status-code caveat:** if the check runs inside a `<Suspense>` boundary the response has already
  started streaming as `200` and the status cannot change. To return a real 401/403, do the check in
  `proxy.ts` before the response streams.

### `redirect()` / `permanentRedirect()`

```ts
import { redirect, permanentRedirect, RedirectType } from 'next/navigation'

redirect('/posts')                          // default type
redirect('/posts', RedirectType.push)       // 'push' | 'replace'
permanentRedirect('/uus-url')
```

Signature: `redirect(path: string, type?: RedirectType): never`.
`type` default is **`'push'` in Server Actions** and **`'replace'` everywhere else**, and it
**has no effect in Server Components**.

Status codes (`01-app/03-api-reference/04-functions/redirect.md`):

| Context | `redirect` | `permanentRedirect` |
|---|---|---|
| Server Component (streaming) | inserts a `<meta>` refresh tag client-side | same |
| Route Handler | **307** | **308** |
| Server Action, JS available | client-side navigation | client-side navigation |
| Server Action, progressive-enhancement form POST | **303** | **303** |

`303` is used for form POSTs so the browser follows with a `GET`.

- Throws `NEXT_REDIRECT`; TypeScript return type is `never` — never write `return redirect()`.
- **Must be called OUTSIDE the `try` block** in Server Actions and Route Handlers.
- Put `revalidatePath` / `revalidateTag` / `updateTag` **before** the `redirect`.
- Callable in Client Components **during render**, but not in event handlers — use `useRouter()` there.
- Accepts absolute/external URLs.
- To redirect before rendering, use `next.config` `redirects()` or `proxy.ts`.
- `permanentRedirect.md` has no version-history section; `redirect.md`'s newest row is `v13.0.0`.

### `unstable_rethrow`

```tsx
import { notFound, unstable_rethrow } from 'next/navigation'

export default async function Page() {
  try {
    const post = await fetch('https://.../posts/1').then((res) => {
      if (res.status === 404) notFound()
      if (!res.ok) throw new Error(res.statusText)
      return res.json()
    })
  } catch (err) {
    unstable_rethrow(err)   // MUST be the first statement in the catch block
    console.error(err)
  }
}
```
Still `unstable_`-prefixed in 16.3.2. Rethrows framework control-flow errors from `notFound()`,
`redirect()`, `permanentRedirect()`, and — when a segment is marked static-only — `cookies()`,
`headers()`, `searchParams`, `fetch(..., { cache: 'no-store' })`, `fetch(..., { next: { revalidate: 0 } })`.
Cleanup must happen before the call or in a `finally` block.

---

## 11. Navigation, request, and response APIs (quick reference)

### `useRouter()` — `next/navigation`, Client Components only

```ts
router.push(href: string, opts?: { scroll?: boolean; transitionTypes?: string[] })
router.replace(href: string, opts?: { scroll?: boolean; transitionTypes?: string[] })
router.refresh()                                  // refetch RSC payload; clears CLIENT cache only
router.prefetch(href: string, opts?: { kind: PrefetchKind; onInvalidate?: () => void })
router.back()
router.forward()
router.bfcacheId                                  // opaque string, stable across back/forward
```
- `router.refresh()` does **not** invalidate the server cache — use `revalidatePath`/`revalidateTag`.
- `transitionTypes` feeds React's `addTransitionType` for `<ViewTransition>`.
- **XSS warning (verbatim):** "You must not send untrusted or unsanitized URLs to `router.push` or
  `router.replace` … `javascript:` URLs sent to `router.push` or `router.replace` will be executed in
  the context of your page."
- ⚠️ The docs type `prefetch`'s options as `{ onInvalidate? }`, but the shipped
  `PrefetchOptions` in `dist/shared/lib/app-router-context.shared-runtime.d.ts` also has a
  **required** `kind: PrefetchKind`.

### `headers()`

```ts
import { headers } from 'next/headers'
const h = await headers()
h.get('user-agent')
```
Async; returns a **read-only** `Headers`. Methods: `entries`, `forEach`, `get`, `has`, `keys`, `values`.
You **cannot** `set` or `delete`. To set response headers, return a new `Response`.
Calling it outside `<Suspense>` under Cache Components prevents prerendering.

### `draftMode()`

```ts
import { draftMode } from 'next/headers'
const { isEnabled } = await draftMode()   // read anywhere
// enable()/disable() only in a Route Handler
```
Cookie: `__prerender_bypass`, regenerated on every `next build`.
`isEnabled` **is** readable inside a cache directive scope; `enable()`/`disable()` inside one **throw**.
While Draft Mode is on, all cached scopes re-execute per request and nothing is written to the cache.
Link to a draft route with `prefetch={false}` or prefetching may delete the cookie.

### `after()`

```ts
import { after } from 'next/server'

export async function POST(request: Request) {
  const res = Response.json({ ok: true })
  after(async () => {
    await log('done')
  })
  return res
}
```
- Import from **`next/server`** — `next/after` does not exist.
- Stable since **v15.1.0**. Signature: `after<T>(task: Promise<T> | (() => T | Promise<T>)): void`.
- Callable in Server Components (including `generateMetadata`), Server Functions, Route Handlers,
  **and Proxy**.
- **Not** a request-time API — it does not make a route dynamic. In a static page the callback runs at
  build time / on revalidation.
- Runs even if the response failed, or `notFound()` / `redirect()` was called.
- In **Route Handlers and Server Functions** you may call `cookies()`/`headers()` inside the callback.
  In **Server Components** that **throws a runtime error**.
- Bound by the route's `maxDuration`. Not supported for static export.

### `connection()`

```ts
import { connection } from 'next/server'
await connection()
```
`() => Promise<void>`, no params. Waits for a real incoming request before continuing. Replaces
`unstable_noStore`. **Prefer `io()`** (see §7b) unless you specifically need to block prefetches.

### `NextResponse` static methods

```ts
NextResponse.json<T>(body: T, init?: ResponseInit): NextResponse<T>
NextResponse.redirect(url: string | URL | NextURL, init?: number | ResponseInit): NextResponse
NextResponse.rewrite(dest: string | URL | NextURL, init?: MiddlewareResponseInit): NextResponse
NextResponse.next(init?: MiddlewareResponseInit): NextResponse

interface MiddlewareResponseInit extends ResponseInit { request?: { headers?: Headers } }
```
Response cookies API: `get`, `getAll`, `set`, `has`, `delete` — **no `clear()`** (unlike request cookies).

> "`NextResponse.next({ headers })` is a shorthand for sending headers from proxy to the client.
> This is **NOT** good practice and should be avoided… setting response headers like `Content-Type`
> can override framework expectations (for example, the `Content-Type` used by Server Actions),
> leading to failed submissions or broken streaming responses."
> "In general, avoid copying all incoming request headers because doing so can leak sensitive data."

### `revalidatePath()`

```ts
revalidatePath(path: string, type?: 'page' | 'layout'): void
```
- `path` ≤ **1024 characters**, **case-sensitive**, no trailing slash needed regardless of `trailingSlash`.
- **`type` is REQUIRED when `path` contains a dynamic segment** (`/product/[slug]`). Omit it for a
  literal path (`/product/1`). Never append `/page` or `/layout` to the path.
- `'layout'` invalidates that layout, all nested layouts, and all pages beneath.
  `revalidatePath('/', 'layout')` purges the **entire client cache** and all cached data.
- With rewrites, pass the **destination** path, not the source.
- Callable in Server Functions and Route Handlers. **Not** in Client Components or Proxy.
- In a Server Action it updates the UI immediately; in a Route Handler it only marks the path, and
  revalidation happens on the next visit.

---

## UNCONFIRMED

Things the bundled docs do not settle. Do not guess past these — verify at the call site.

1. **`metadataBase` default value.** The docs never state it. `dist/lib/metadata/types/metadata-interface.d.ts`
   only says "If not provided, Next.js will populate a default value based on environment variables."
   The env var names and fallback URL are **not documented**. Set `metadataBase` explicitly.
2. **`headers()` / `redirects()` as `async`.** All doc examples use the bare `headers() {}` form; the
   prose says either is allowed. `async headers()` is almost certainly fine but no example shows it.
3. **`images.qualities` — default or required?** `01-app/03-api-reference/02-components/image.md` says
   both "Default: `[75]`" and "This field is required starting with Next.js 16". The shipped
   `dist/shared/lib/image-config.js` has `qualities: [75]` as a default, so it is not literally
   required — but relying on the default silently coerces every non-75 `quality`.
4. **`cacheMaxMemorySize` semantics.** Only ever shown as `cacheMaxMemorySize: 0` ("disable default
   in-memory caching"). Units, non-zero behavior, and default are **not documented**.
5. **`fill` parent requirements.** `image.md` § `fill` says the parent must be
   `position: relative | fixed | absolute`; § "Styling images" in the same file says
   `position: relative` **or** `display: block`. The doc contradicts itself. Use
   `position: relative` — it satisfies both readings.
6. **`next/form`'s `prefetch` prop.** The doc says `boolean`, default `true`, and shows
   `prefetch={true}`. `dist/client/form-shared.d.ts` types it as **`false | null`**, default `null`.
   **`prefetch={true}` will not type-check.** Omit it or pass `false`.
7. **`fetchPriority` on `next/image`.** Recommended in prose ("use `fetchPriority="high"` instead of
   `preload`") but has **no props-table row, no section, and no documented default**. It is a real
   destructured prop in `dist/shared/lib/get-img-props.js` and passes through to `<img>`.
8. **`generateImageMetadata`'s own `params`.** Documented as a **synchronous** object while the image
   function's `params` is a Promise. The v16 version-history rows only mention the image generation
   function. This asymmetry may be a doc bug — check at runtime before relying on it.
9. **Route Handler request-body size cap.** No Next.js-level limit is documented for Route Handlers
   (only Server Actions at 1 MB and proxy buffering at 10 MB). The hosting platform's limit applies.
10. **`use cache` durability on Vercel serverless.** The docs say in-memory entries "typically don't
    persist across requests" on serverless and recommend `'use cache: remote'` for durable storage,
    but do not state what Vercel provides out of the box. Measure before assuming R2 reads are
    actually deduped at runtime under `use cache` alone.
11. **`next-intl` + `proxy.ts` composition.** Next.js's docs cover `proxy.ts`; `next-intl` 4.13.7's
    types confirm `next-intl/middleware` still exports `createMiddleware`. **Neither project's docs
    document the composed form** — the wrapper in §7 is assembled from both APIs, not copied from a
    doc. Verify locale routing and the admin redirect together after any change.
12. **`error.tsx`'s `reset` prop long-term.** It is still passed (`dist/client/components/error-boundary.js`
    passes both `reset` and `retry`) but is absent from the v16 `error.md`. Assume it is on a
    deprecation path; write `retry`.
13. **Placeholder version numbers in the shipped docs.** These rows are literally unresolved:
    `` v16.x.x | `prefetch` export introduced `` (`route-segment-config/prefetch.md`),
    `` v16.x.x `` (`route-segment-config/instant.md`), and
    `` v16.x.0 | `useOffline` hook introduced `` (`04-functions/use-offline.md` and
    `05-config/01-next-config-js/useOffline.md`). The exact release is not determinable from the docs.
14. **`unstable_after` removal is not documented.** The string appears exactly once in the whole docs
    tree — `after.md`'s `` v15.0.0-rc | unstable_after introduced `` row. There is **no removal notice**
    for v16. `after` is stable and exported from `next/server`; whether `unstable_after` still resolves
    is unverified.
15. **`useRouter`'s `bfcacheId` and `transitionTypes` are undated.** Both are documented in
    `use-router.md`'s method list but appear in **no** version-history row for `useRouter`.
    `transitionTypes` is dated only for `<Link>` (v16.2.0).
16. **`router.prefetch` options.** Docs show `{ onInvalidate? }`; the shipped `PrefetchOptions`
    interface also has a **required** `kind: PrefetchKind`, plus an undocumented
    `experimental_gesturePush` on `AppRouterInstance`.
17. **`'use server'` argument types.** `01-directives/use-server.md` contains an unfilled
    `{/* TODO: showcase input validation */}` and never states which argument types are allowed —
    it defers to React's docs. Only the return-value guidance is concrete.
18. **`sitemap.ts` documented return type is stale.** The docs' `Returns` block omits `images` and
    `videos`, but both have dedicated example sections in the same file and both exist in
    `dist/lib/metadata/types/metadata-interface.d.ts`. Trust the `.d.ts`.
19. **`generateSitemaps` URL pattern.** `sitemap.md` says `/.../sitemap/[id]`;
    `generate-sitemaps.md` says `/.../sitemap/[id].xml`. The worked example is
    `/product/sitemap/1.xml` in both. Its own example also types `id` as `Promise<string>` then
    multiplies it as a number.
20. **`authentication.md`'s DAL example does not compile as written** — it uses `cache` and `redirect`
    without importing them. Add `import { cache } from 'react'` and
    `import { redirect } from 'next/navigation'`.
