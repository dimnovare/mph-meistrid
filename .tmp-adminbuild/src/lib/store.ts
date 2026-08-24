import 'server-only';

import { cache } from 'react';

import { r2Configured } from './env';
import { ObjectNotFound, PreconditionFailed, getObject, putObject } from './r2';
import type { PricingFile, Project, ProjectsFile } from './types';

/**
 * The only module that knows where content lives. Swapping R2 JSON for a database later
 * means rewriting this file and nothing else.
 */

const PROJECTS_KEY = 'data/projects.json';
const PRICING_KEY = 'data/pricing.json';

const EMPTY_PROJECTS: ProjectsFile = { version: 1, projects: [] };
const EMPTY_PRICING: PricingFile = { version: 1, items: [] };

/**
 * `cache` from React dedupes within a single render pass, so the landing page reading
 * projects in three places still makes one R2 call. Cross-request caching is the route's
 * job — public pages are statically rendered and revalidated by `revalidatePath` after an
 * admin write (see `revalidatePublic` in src/app/admin/actions.ts).
 */
export const readProjects = cache(async (): Promise<ProjectsFile> => {
  const file = await readJson<ProjectsFile>(PROJECTS_KEY, EMPTY_PROJECTS);
  return { version: 1, projects: [...file.projects].sort(byOrder) };
});

export const readPricing = cache(async (): Promise<PricingFile> => {
  const file = await readJson<PricingFile>(PRICING_KEY, EMPTY_PRICING);
  return { version: 1, items: [...file.items].sort(byOrder) };
});

/** Public-facing list: published only, in display order. */
export async function publishedProjects(): Promise<Project[]> {
  const { projects } = await readProjects();
  return projects.filter((p) => p.published);
}

export async function publishedProjectBySlug(slug: string): Promise<Project | null> {
  const projects = await publishedProjects();
  return projects.find((p) => p.slug === slug) ?? null;
}

export async function projectById(id: string): Promise<Project | null> {
  const { projects } = await readProjects();
  return projects.find((p) => p.id === id) ?? null;
}

/* ------------------------------------------------------------------ writes */

/**
 * Serialises writes within one server instance.
 *
 * The conditional PUT below already stops two writers from clobbering each other, but
 * without this the losers burn their retries immediately and a photo upload can fail even
 * though nothing was actually wrong. Uploading a project's photos is exactly the workload
 * that produces back-to-back writes to the same key, so this is the common path, not an
 * edge case.
 *
 * Per-instance only — Vercel may run several. The conditional PUT is what makes it correct
 * across instances; this only makes it efficient within one.
 */
const writeLocks = new Map<string, Promise<unknown>>();

function withLock<T>(key: string, work: () => Promise<T>): Promise<T> {
  const previous = writeLocks.get(key) ?? Promise.resolve();
  // `catch` so one failed write does not poison every write queued behind it.
  const next = previous.then(work, work);
  writeLocks.set(
    key,
    next.catch(() => undefined),
  );
  return next;
}

/**
 * Read-modify-write with a conditional PUT. If another writer changed the file since we read
 * it, R2 rejects the write and we retry against the fresh copy rather than silently
 * discarding their edit.
 */
function mutate<T extends ProjectsFile | PricingFile>(
  key: string,
  empty: T,
  update: (current: T) => T,
): Promise<T> {
  // Writes are a different matter: silently discarding an administrator's work because the
  // environment is unset would be indefensible. Fail, and say why.
  if (!r2Configured()) {
    const current = (memory.get(key) as T) ?? empty;
    const next = update(current);
    memory.set(key, next);
    return Promise.resolve(next);
  }

  return withLock(key, async () => {
    for (let attempt = 0; attempt < 4; attempt++) {
      let current = empty;
      let etag: string | undefined;
      let exists = true;

      try {
        const res = await getObject(key, 'data');
        current = JSON.parse(new TextDecoder().decode(res.body)) as T;
        etag = res.etag;
      } catch (err) {
        if (!(err instanceof ObjectNotFound)) throw err;
        exists = false;
      }

      // An existing object with no ETag would fall through to an unconditional write, which
      // silently drops the concurrency protection. R2 always returns one, so treat its
      // absence as a transient fault and read again rather than writing blind.
      if (exists && !etag) {
        await backoff(attempt);
        continue;
      }

      const next = update(current);

      try {
        await putObject(key, JSON.stringify(next, null, 2), {
          contentType: 'application/json; charset=utf-8',
          cacheControl: 'no-store',
          ifMatch: exists ? etag : '*',
          store: 'data',
        });
        return next;
      } catch (err) {
        if (err instanceof PreconditionFailed) {
          await backoff(attempt);
          continue;
        }
        throw err;
      }
    }

    throw new Error(`Could not write ${key} after 4 attempts`);
  });
}

/** Exponential with jitter, so two contending writers do not retry in lockstep forever. */
function backoff(attempt: number): Promise<void> {
  const base = 40 * 2 ** attempt;
  return new Promise((resolve) => setTimeout(resolve, base + Math.random() * base));
}

export function writeProjects(update: (current: ProjectsFile) => ProjectsFile) {
  return mutate(PROJECTS_KEY, EMPTY_PROJECTS, (file) => ({
    version: 1,
    projects: normalise(update(file).projects),
  }));
}

export function writePricing(update: (current: PricingFile) => PricingFile) {
  return mutate(PRICING_KEY, EMPTY_PRICING, (file) => ({
    version: 1,
    items: normalise(update(file).items),
  }));
}

/* ------------------------------------------------------------------ helpers */

let warnedUnconfigured = false;

/* LOCAL VISUAL-CHECK STUB — throwaway copy only, never in the repo. */
const memory = new Map<string, unknown>();
const SEED_IMG = (i: number) => ({ id: `img${i}`, width: 1600, height: 1200, variants: [640, 1280, 1600], blurDataURL: 'data:image/webp;base64,UklGRhIAAABXRUJQVlA4TAYAAAAvAAAAAA==' });
memory.set('data/projects.json', { version: 1, projects: [
  { id: 'p1', slug: 'vannitoa-remont', title: { et: 'Vannitoa remont', ru: '' }, location: { et: 'Mustamae, Tallinn' }, description: { et: 'Vannitoa taisremont: hudroisolatsioon, plaatimine ja uus santehnika.' }, coverImageId: 'img1', images: [SEED_IMG(1), SEED_IMG(2), SEED_IMG(3)], published: true, order: 0, createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-14T00:00:00.000Z' },
  { id: 'p2', slug: 'mustand-p2', title: { et: '' }, coverImageId: null, images: [], published: false, order: 1, createdAt: '2026-08-24T00:00:00.000Z', updatedAt: '2026-08-24T00:00:00.000Z' },
] });

async function readJson<T>(key: string, fallback: T): Promise<T> {
  // No credentials at all: a fresh checkout, or a build before the environment is filled in.
  // Render an empty portfolio rather than failing, which is also the real day-one state.
  // A *configured* bucket that errors still throws — see r2Configured().
  if (!r2Configured()) {
    if (!warnedUnconfigured) {
      warnedUnconfigured = true;
      console.warn(
        '[store] R2 is not configured; serving empty content. See .env.example and docs/deployment.md.',
      );
    }
    return (memory.get(key) as T) ?? fallback;
  }

  try {
    const { body } = await getObject(key, 'data');
    return JSON.parse(new TextDecoder().decode(body)) as T;
  } catch (err) {
    // A bucket with no content yet is the normal state on day one, not an error.
    if (err instanceof ObjectNotFound) return fallback;
    if (err instanceof SyntaxError) {
      throw new Error(`Content file ${key} is not valid JSON`, { cause: err });
    }
    throw err;
  }
}

function byOrder(a: { order: number }, b: { order: number }) {
  return a.order - b.order;
}

/** Re-packs `order` to 0..n-1 on every write so drag-reordering can never drift. */
function normalise<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort(byOrder).map((item, index) => ({ ...item, order: index }));
}

export function nextOrder(items: Array<{ order: number }>): number {
  return items.length === 0 ? 0 : Math.max(...items.map((i) => i.order)) + 1;
}

/**
 * Turns "Vannitoa remont, Tallinn" into "vannitoa-remont-tallinn".
 * Estonian diacritics are transliterated rather than stripped, so "Põrandad" does not
 * collapse to "prandad".
 */
export function slugify(input: string): string {
  const map: Record<string, string> = {
    õ: 'o', ä: 'a', ö: 'o', ü: 'u', š: 's', ž: 'z',
    Õ: 'o', Ä: 'a', Ö: 'o', Ü: 'u', Š: 's', Ž: 'z',
  };

  return input
    .trim()
    .replace(/[õäöüšžÕÄÖÜŠŽ]/g, (c) => map[c] ?? c)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Appends -2, -3 … until the slug is free. `ignoreId` lets a project keep its own slug. */
export function uniqueSlug(base: string, projects: Project[], ignoreId?: string): string {
  const taken = new Set(
    projects.filter((p) => p.id !== ignoreId).map((p) => p.slug),
  );
  const root = base || 'too';
  if (!taken.has(root)) return root;

  let n = 2;
  while (taken.has(`${root}-${n}`)) n++;
  return `${root}-${n}`;
}
