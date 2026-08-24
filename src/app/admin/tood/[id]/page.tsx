import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { ProjectForm } from '@/components/admin/ProjectForm';
import { Container } from '@/components/ui/Container';
import { adminText } from '@/content/admin-text';
import { currentUser } from '@/lib/auth';
import { MAX_PHOTOS_PER_PROJECT, projectMediaPrefix } from '@/lib/images';
import { publicUrl } from '@/lib/r2';
import { projectById } from '@/lib/store';

/**
 * Edit one job.
 *
 * Everything the client component cannot work out for itself is resolved here: where photos
 * are served from (the R2 configuration is server-only) and how many of them a job may hold.
 */

const backLink =
  'inline-flex min-h-14 items-center gap-2 self-start rounded-panel px-2 text-body ' +
  'font-semibold text-fg-strong transition-colors hover:bg-surface-2';

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await currentUser())) redirect('/admin/login');

  // `params` is a Promise in Next 16 — the synchronous compatibility shim is gone.
  const { id } = await params;

  const project = await projectById(id);
  if (!project) notFound();

  const named = project.title.et.trim().length > 0;

  return (
    <Container width="form" className="flex flex-col gap-6 py-8">
      <Link href="/admin" className={backLink}>
        <svg viewBox="0 0 20 20" aria-hidden="true" fill="currentColor" className="size-5">
          <path d="M12.7 3.3a1 1 0 0 1 0 1.4L7.4 10l5.3 5.3a1 1 0 0 1-1.4 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.4 0Z" />
        </svg>
        {adminText.project.back}
      </Link>

      <h1 className="font-display text-[1.75rem] font-bold leading-tight">
        {named ? adminText.project.editHeading : adminText.project.newHeading}
      </h1>

      <ProjectForm
        project={project}
        mediaBase={publicUrl(projectMediaPrefix(project.id))}
        maxPhotos={MAX_PHOTOS_PER_PROJECT}
      />
    </Container>
  );
}
