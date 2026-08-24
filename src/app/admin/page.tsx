import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createDraftAction } from '@/app/admin/actions';
import { ProjectList, type ProjectRow } from '@/components/admin/ProjectList';
import { Container } from '@/components/ui/Container';
import { adminText } from '@/content/admin-text';
import { currentUser } from '@/lib/auth';
import { projectMediaPrefix } from '@/lib/images';
import { publicUrl } from '@/lib/r2';
import { readProjects } from '@/lib/store';

/**
 * The dashboard, and on day one the very first screen he ever sees — with nothing on it.
 *
 * Two full-width 88px actions at the top, each with one line saying what it does, then the
 * list of jobs. Nothing else: no counts he did not ask for, no charts, no navigation.
 */

// §9 dashboard actions: full width, 88px tall, 20px label. Written out here rather than
// taken from `Button` because the class strings in a `'use client'` module cannot be
// imported into a Server Component — they would arrive as client references, not strings.
const heroBase =
  'flex min-h-22 w-full items-center justify-center rounded-panel px-6 text-center ' +
  'font-display text-[1.25rem] font-bold leading-snug transition-colors';

const heroPrimary = `${heroBase} bg-accent text-on-accent shadow-edge hover:bg-accent-hover active:bg-accent-press`;

const heroSecondary = `${heroBase} border-2 border-fg-strong bg-page text-fg-strong hover:bg-surface-2 active:bg-surface-2`;

const linkControl =
  'inline-flex min-h-14 w-full items-center justify-center rounded-panel border-2 ' +
  'border-line-strong bg-page px-5 py-2 text-body font-semibold text-fg-strong ' +
  'transition-colors hover:bg-surface-2 sm:w-auto';

const hintClass = 'mt-2 mb-4 text-body text-fg-muted';

/** Estonian has exactly two plural forms. */
function plural(forms: { one: string; other: string }, count: number): string {
  return (count === 1 ? forms.one : forms.other).replace('{count}', String(count));
}

const estonianDate = new Intl.DateTimeFormat('et-EE', {
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
});

export default async function AdminDashboardPage() {
  // Repeated here even though `layout.tsx` already checked: a layout does not re-render on
  // every navigation, so the page is what actually guarantees this request is authorised.
  if (!(await currentUser())) redirect('/admin/login');

  const { projects } = await readProjects();

  // Everything the list needs is resolved here, on the server: the client component never
  // has to know where photos live, how a bilingual field falls back, or how a date is
  // written in Estonian.
  const rows: ProjectRow[] = projects.map((project) => {
    const cover =
      project.images.find((image) => image.id === project.coverImageId) ?? project.images[0];

    return {
      id: project.id,
      title: project.title.et.trim(),
      published: project.published,
      photoCount: project.images.length,
      coverSrc: cover ? publicUrl(`${projectMediaPrefix(project.id)}${cover.id}`) : null,
      coverBlur: cover?.blurDataURL ?? null,
      updatedLabel: estonianDate.format(new Date(project.updatedAt)),
    };
  });

  return (
    <Container width="form" className="flex flex-col gap-8 py-8">
      <div>
        <h1 className="font-display text-[1.75rem] font-bold leading-tight">
          {adminText.dashboard.heading}
        </h1>
        <p className="mt-2 text-body text-fg-strong">{adminText.dashboard.intro}</p>
      </div>

      <div>
        {/*
          Posts the action straight from the dashboard, so adding a job is one tap and lands
          on an edit screen that already exists and is ready for photos. /admin/tood/uus is
          only for someone who typed or bookmarked that address.
        */}
        <form action={createDraftAction}>
          <button type="submit" className={heroPrimary}>
            {adminText.dashboard.addWork}
          </button>
        </form>
        <p className={hintClass}>{adminText.dashboard.addWorkHint}</p>

        <Link href="/admin/hinnad" className={heroSecondary}>
          {adminText.dashboard.editPrices}
        </Link>
        <p className={hintClass}>{adminText.dashboard.editPricesHint}</p>
      </div>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-display text-[1.5rem] font-bold leading-tight">
            {adminText.dashboard.works.heading}
          </h2>
          {rows.length > 0 ? (
            <p className="mt-1 text-body text-fg-muted">
              {plural(adminText.dashboard.worksCount, rows.length)}
            </p>
          ) : null}
        </div>

        <ProjectList rows={rows} />
      </section>

      <Link href="/" className={linkControl}>
        {adminText.dashboard.viewSite}
      </Link>
    </Container>
  );
}
