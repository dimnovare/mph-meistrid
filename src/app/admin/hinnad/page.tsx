import Link from 'next/link';
import { redirect } from 'next/navigation';

import { PriceEditor } from '@/components/admin/PriceEditor';
import { Container } from '@/components/ui/Container';
import { adminText } from '@/content/admin-text';
import { currentUser } from '@/lib/auth';
import { readPricing } from '@/lib/store';

const backLink =
  'inline-flex min-h-14 items-center gap-2 self-start rounded-panel px-2 text-body ' +
  'font-semibold text-fg-strong transition-colors hover:bg-surface-2';

export default async function PricingPage() {
  if (!(await currentUser())) redirect('/admin/login');

  const { items } = await readPricing();

  return (
    <Container width="form" className="flex flex-col gap-6 py-8">
      <Link href="/admin" className={backLink}>
        <svg viewBox="0 0 20 20" aria-hidden="true" fill="currentColor" className="size-5">
          <path d="M12.7 3.3a1 1 0 0 1 0 1.4L7.4 10l5.3 5.3a1 1 0 0 1-1.4 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.4 0Z" />
        </svg>
        {adminText.project.back}
      </Link>

      <div>
        <h1 className="font-display text-[1.75rem] font-bold leading-tight">
          {adminText.pricing.heading}
        </h1>
        <p className="mt-2 text-body text-fg-strong">{adminText.pricing.intro}</p>
      </div>

      <PriceEditor items={items} />
    </Container>
  );
}
