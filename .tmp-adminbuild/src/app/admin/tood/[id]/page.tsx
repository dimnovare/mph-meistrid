import { notFound, redirect } from 'next/navigation';

import { ProjectForm } from '@/components/admin/ProjectForm';
import { adminColumn } from '@/components/admin/styles';
import { currentUser } from '@/lib/auth';
import { MAX_PHOTOS_PER_PROJECT, projectMediaPrefix } from '@/lib/images';
import { publicUrl } from '@/lib/r2';
import { projectById } from '@/lib/store';

/**
 * Edit one job.
 *
 * Everything the client component cannot work out for itself is resolved here: where photos
 * are served from (the R2 configuration is server-only) and how many of them a job may hold.
 *
 * The heading and the back control belong to the form rather than to this page, because both
 * depend on state only the form has — the heading on whether the job has been named, and the
 * back control on whether there is unsaved work to stop and ask about.
 */
export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await currentUser())) redirect('/admin/login');

  // `params` is a Promise in Next 16 — the synchronous compatibility shim is gone.
  const { id } = await params;

  const project = await projectById(id);
  if (!project) notFound();

  return (
    <div className={`${adminColumn} py-7 sm:py-9`}>
      <ProjectForm
        project={project}
        mediaBase={publicUrl(projectMediaPrefix(project.id))}
        maxPhotos={MAX_PHOTOS_PER_PROJECT}
      />
    </div>
  );
}
