import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createDraftAction } from '@/app/admin/actions';
import { ProjectList, type ProjectRow } from '@/components/admin/ProjectList';
import { BrickGlyph } from '@/components/admin/icons';
import {
  adminColumn,
  adminEmptyPanel,
  adminH1,
  adminH2,
  adminHeroPrimary,
  adminHeroSecondary,
  adminHint,
  adminMeta,
  adminTextLink,
} from '@/components/admin/styles';
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
 *
 * Everything on this screen is server-rendered except the list itself, which needs a client
 * for the ↑ / ↓ buttons — the empty state in particular is static markup and stays on the
 * server, which is also the version most people will see first.
 */

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
    <div className={`${adminColumn} flex flex-col gap-6 py-7 sm:py-9`}>
      <div className="flex flex-col gap-1.5">
        <h1 className={adminH1}>{adminText.dashboard.heading}</h1>
        <p className="text-[1.125rem] leading-[1.4] text-fg-strong">
          {adminText.dashboard.intro}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        {/*
          Posts the action straight from the dashboard, so adding a job is one tap and lands
          on an edit screen that already exists and is ready for photos. /admin/tood/uus is
          only for someone who typed or bookmarked that address.
        */}
        <form action={createDraftAction}>
          <button type="submit" className={adminHeroPrimary}>
            {adminText.dashboard.addWork}
          </button>
        </form>
        <p className={adminHint}>{adminText.dashboard.addWorkHint}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Link href="/admin/hinnad" className={adminHeroSecondary}>
          {adminText.dashboard.editPrices}
        </Link>
        <p className={adminHint}>{adminText.dashboard.editPricesHint}</p>
      </div>

      <section className="flex flex-col gap-4">
        {/* The 2px rule is where the "what do you want to do" half of the screen ends. */}
        <div className="flex items-baseline justify-between gap-4 border-t-2 border-fg-strong pt-4.5">
          <h2 className={adminH2}>{adminText.dashboard.works.heading}</h2>
          <p className={adminMeta}>{plural(adminText.dashboard.worksCount, rows.length)}</p>
        </div>

        {rows.length === 0 ? (
          /*
            Day one. This is the first impression of the whole product for the client and for
            anyone reviewing it, so it says what will appear here and gives exactly one next
            step with a time on it — an empty page with a single instruction reads as
            unfinished, and the five-minute figure is what stops him putting it off.
          */
          <div className={`${adminEmptyPanel} flex flex-col items-start gap-3.5`}>
            <BrickGlyph className="w-11 text-line-strong" />
            <p className="text-[1.125rem] leading-[1.4] font-semibold text-fg-strong">
              {adminText.dashboard.emptyTitle}
            </p>
            <p className="text-[1rem] leading-[1.55] text-fg-strong">
              {adminText.dashboard.emptyBody}
            </p>
          </div>
        ) : (
          <ProjectList rows={rows} />
        )}
      </section>

      <Link href="/" className={`${adminTextLink} self-center`}>
        {adminText.dashboard.viewSite}
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
