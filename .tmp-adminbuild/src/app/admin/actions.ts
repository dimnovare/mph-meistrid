'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import {
  checkCredentials,
  clearLoginAttempts,
  currentUser,
  endSession,
  loginAllowed,
  rateLimitKey,
  recordFailedLogin,
  startSession,
} from '@/lib/auth';
import { adminText } from '@/content/admin-text';
import { newId } from '@/lib/ids';
import { projectMediaPrefix, variantKey } from '@/lib/images';
import { deleteKeys, deletePrefix } from '@/lib/r2';
import {
  nextOrder,
  projectById,
  readProjects,
  slugify,
  uniqueSlug,
  writePricing,
  writeProjects,
} from '@/lib/store';
import type { Localized, PriceItem, Project } from '@/lib/types';

/**
 * Every admin mutation.
 *
 * Server Actions rather than Route Handlers: Next verifies the Origin header on them
 * automatically, they need no client-side fetch code, and the forms keep working before
 * JavaScript has loaded — which matters on a phone with one bar of signal. The one
 * exception is photo upload, which needs per-file progress and lives in
 * `src/app/api/admin/upload/route.ts`.
 */

export type FormState = { error?: string; ok?: boolean };

/* ------------------------------------------------------------------- guards */

async function guard(): Promise<void> {
  if (!(await currentUser())) redirect('/admin/login');
}

/**
 * Public pages are statically rendered; this is what makes an edit visible immediately.
 *
 * `revalidateTag` is not used: in Next 16 it takes a mandatory cacheLife profile, and with a
 * stale-while-revalidate profile it deliberately skips the immediate re-render — the wrong
 * behaviour for someone who just pressed Save. `revalidatePath` does re-render in the same
 * response. It must also be called before any `redirect()`, which throws.
 */
function revalidatePublic(): void {
  revalidatePath('/', 'layout');
  // The sitemap is its own route with its own revalidate window, so a new project would
  // otherwise wait up to an hour to become discoverable.
  revalidatePath('/sitemap.xml');
}

/* -------------------------------------------------------------------- login */

const credentials = z.object({
  username: z.string().min(1).max(200),
  password: z.string().min(1).max(400),
});

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = credentials.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: adminText.errors.loginFieldsEmpty };
  }

  // Not the leftmost x-forwarded-for entry — that one is client-supplied and would let an
  // attacker present a fresh address on every request, defeating the limiter entirely.
  const ip = rateLimitKey(await headers());

  if (!loginAllowed(ip)) {
    return { error: adminText.errors.tooManyAttempts };
  }

  if (!(await checkCredentials(parsed.data.username, parsed.data.password))) {
    recordFailedLogin(ip);
    // Deliberately does not reveal which of the two fields was wrong.
    return { error: adminText.errors.wrongCredentials };
  }

  clearLoginAttempts(ip);
  await startSession(parsed.data.username);
  redirect('/admin');
}

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect('/admin/login');
}

/* ----------------------------------------------------------------- projects */

/**
 * Creates an empty draft and redirects to its edit screen, so the photo uploader has
 * somewhere to put files before the administrator has typed anything. One tap from the
 * dashboard lands on a screen that is ready for photos.
 *
 * Abandoned empty drafts are pruned here rather than accumulating.
 */
export async function createDraftAction(): Promise<never> {
  await guard();

  const id = newId();
  const now = new Date().toISOString();

  await writeProjects((current) => {
    const kept = current.projects.filter((p) => !isAbandonedDraft(p));
    const draft: Project = {
      id,
      slug: `mustand-${id}`,
      title: { et: '' },
      coverImageId: null,
      images: [],
      published: false,
      order: nextOrder(kept),
      createdAt: now,
      updatedAt: now,
    };
    return { ...current, projects: [...kept, draft] };
  });

  redirect(`/admin/tood/${id}`);
}

function isAbandonedDraft(project: Project): boolean {
  return !project.published && project.title.et.trim() === '' && project.images.length === 0;
}

const localized = (max: number) =>
  z.object({
    et: z.string().trim().max(max),
    ru: z.string().trim().max(max).optional(),
  });

const projectInput = z.object({
  id: z.string().min(1),
  title: localized(160).refine((v) => v.et.length > 0),
  location: localized(160).optional(),
  description: localized(2000).optional(),
  published: z.boolean(),
});

export async function saveProjectAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await guard();

  const parsed = projectInput.safeParse({
    id: formData.get('id'),
    title: pair(formData, 'title'),
    location: pair(formData, 'location'),
    description: pair(formData, 'description'),
    published: formData.get('published') === 'true',
  });

  if (!parsed.success) {
    return { error: adminText.errors.titleRequired };
  }

  const input = parsed.data;
  let found = false;

  try {
    await writeProjects((current) => {
      const existing = current.projects.find((p) => p.id === input.id);
      if (!existing) return current;
      found = true;

      // The slug is fixed once the project has been published, so a URL Google has already
      // indexed does not change when the client later fixes a typo in the title.
      const settled = existing.published && !existing.slug.startsWith('mustand-');
      const slug = settled
        ? existing.slug
        : uniqueSlug(slugify(input.title.et), current.projects, input.id);

      return {
        ...current,
        projects: current.projects.map((p) =>
          p.id !== input.id
            ? p
            : {
                ...p,
                slug,
                title: clean(input.title) ?? { et: input.title.et },
                location: clean(input.location),
                description: clean(input.description),
                published: input.published,
                updatedAt: new Date().toISOString(),
              },
        ),
      };
    });
  } catch (err) {
    console.error('[saveProject]', err);
    return { error: adminText.errors.saveFailed };
  }

  if (!found) return { error: adminText.errors.workNotFound };

  revalidatePublic();
  revalidatePath('/admin');
  redirect('/admin');
}

/**
 * Returns `FormState` rather than void so a failed delete reaches the administrator as a
 * sentence in Estonian. Without this the store's exception propagates raw and the builder
 * gets a blank screen or a stack trace, which the brief explicitly forbids.
 *
 * The `redirect()` sits outside the try: it works by throwing, so catching around it would
 * swallow the navigation and report a phantom failure.
 */
export async function deleteProjectAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await guard();

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: adminText.errors.workNotFound };

  // Checked so a stale tab gets "this work no longer exists" rather than silently deleting a
  // media prefix for an id that is already gone.
  if (!(await projectById(id))) return { error: adminText.errors.workNotFound };

  try {
    await writeProjects((current) => ({
      ...current,
      projects: current.projects.filter((p) => p.id !== id),
    }));
  } catch (err) {
    console.error('[deleteProject]', { id }, err);
    return { error: adminText.errors.deleteFailed };
  }

  // Photos are removed after the metadata, so a failure here leaves orphaned bytes in the
  // bucket rather than a project pointing at files that no longer exist. The administrator
  // is not told about it — from their point of view the work is gone, which is true, and
  // there is no action they could take.
  try {
    await deletePrefix(projectMediaPrefix(id));
  } catch (err) {
    console.error('[deleteProject] media cleanup failed', { id }, err);
  }

  revalidatePublic();
  revalidatePath('/admin');
  redirect('/admin');
}

/* ------------------------------------------------------------------- photos */

export async function deleteImageAction(formData: FormData): Promise<void> {
  await guard();

  const projectId = String(formData.get('projectId') ?? '');
  const imageId = String(formData.get('imageId') ?? '');
  if (!projectId || !imageId) return;

  const { projects } = await readProjects();
  const image = projects.find((p) => p.id === projectId)?.images.find((i) => i.id === imageId);

  await writeProjects((current) => ({
    ...current,
    projects: current.projects.map((p) => {
      if (p.id !== projectId) return p;
      const images = p.images.filter((i) => i.id !== imageId);
      return {
        ...p,
        images,
        // Removing the cover promotes the next photo rather than leaving the card blank.
        coverImageId: p.coverImageId === imageId ? (images[0]?.id ?? null) : p.coverImageId,
        updatedAt: new Date().toISOString(),
      };
    }),
  }));

  if (image) {
    try {
      await deleteKeys(image.variants.map((width) => variantKey(projectId, imageId, width)));
    } catch (err) {
      console.error('[deleteImage] media cleanup failed', { projectId, imageId }, err);
    }
  }

  revalidatePublic();
  revalidatePath(`/admin/tood/${projectId}`);
}

export async function setCoverAction(formData: FormData): Promise<void> {
  await guard();

  const projectId = String(formData.get('projectId') ?? '');
  const imageId = String(formData.get('imageId') ?? '');
  if (!projectId || !imageId) return;

  await writeProjects((current) => ({
    ...current,
    projects: current.projects.map((p) =>
      p.id !== projectId || !p.images.some((i) => i.id === imageId)
        ? p
        : { ...p, coverImageId: imageId, updatedAt: new Date().toISOString() },
    ),
  }));

  revalidatePublic();
  revalidatePath(`/admin/tood/${projectId}`);
}

export async function reorderImagesAction(
  projectId: string,
  orderedIds: string[],
): Promise<void> {
  await guard();

  await writeProjects((current) => ({
    ...current,
    projects: current.projects.map((p) => {
      if (p.id !== projectId) return p;

      const byId = new Map(p.images.map((i) => [i.id, i]));
      const reordered = orderedIds
        .map((id) => byId.get(id))
        .filter((i): i is NonNullable<typeof i> => i !== undefined);
      // Photos the client did not mention keep their place at the end, so a stale tab
      // cannot silently delete photos by omitting them from the list.
      const missing = p.images.filter((i) => !orderedIds.includes(i.id));

      return { ...p, images: [...reordered, ...missing], updatedAt: new Date().toISOString() };
    }),
  }));

  revalidatePublic();
  revalidatePath(`/admin/tood/${projectId}`);
}

export async function reorderProjectsAction(orderedIds: string[]): Promise<void> {
  await guard();

  await writeProjects((current) => {
    const rank = new Map(orderedIds.map((id, index) => [id, index]));
    return {
      ...current,
      projects: current.projects.map((p) => ({
        ...p,
        order: rank.get(p.id) ?? p.order + orderedIds.length,
      })),
    };
  });

  revalidatePublic();
  revalidatePath('/admin');
}

/* ------------------------------------------------------------------ pricing */

const pricingInput = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1).max(40),
        service: localized(120),
        price: localized(120),
        note: localized(200).optional(),
      }),
    )
    .max(40),
});

export async function savePricingAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await guard();

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get('items') ?? '[]'));
  } catch {
    return { error: adminText.errors.priceSaveFailed };
  }

  const parsed = pricingInput.safeParse({ items: raw });
  if (!parsed.success) {
    return { error: adminText.errors.priceRowTooLong };
  }

  // A row with no service name is one the administrator started and abandoned. Dropping it
  // silently is friendlier than refusing to save the rest of the table.
  const items: PriceItem[] = parsed.data.items
    .filter((item) => item.service.et.trim().length > 0)
    .map((item, index) => ({
      id: item.id,
      service: clean(item.service) ?? { et: '' },
      price: clean(item.price) ?? { et: '' },
      note: clean(item.note),
      order: index,
    }));

  try {
    await writePricing((current) => ({ ...current, items }));
  } catch (err) {
    console.error('[savePricing]', err);
    return { error: adminText.errors.priceSaveFailed };
  }

  revalidatePublic();
  revalidatePath('/admin/hinnad');
  return { ok: true };
}

/* ------------------------------------------------------------------ helpers */

function pair(formData: FormData, name: string): Localized {
  return {
    et: String(formData.get(`${name}_et`) ?? ''),
    ru: String(formData.get(`${name}_ru`) ?? ''),
  };
}

/** Drops empty strings so the stored JSON stays free of `""` noise and `t()` falls back. */
function clean(value: Localized | undefined): Localized | undefined {
  if (!value) return undefined;
  const et = value.et.trim();
  const ru = value.ru?.trim();
  if (!et && !ru) return undefined;
  return ru ? { et, ru } : { et };
}
