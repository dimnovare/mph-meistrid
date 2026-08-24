import Link from 'next/link';
import { redirect } from 'next/navigation';

import { PriceEditor } from '@/components/admin/PriceEditor';
import { BackArrow } from '@/components/admin/icons';
import { adminColumn, adminDivider, adminH1, adminTextLink } from '@/components/admin/styles';
import { adminText } from '@/content/admin-text';
import { currentUser } from '@/lib/auth';
import { readPricing } from '@/lib/store';

/**
 * The price list.
 *
 * A plain `<Link>` back, unlike the edit screen's guarded button: leaving this page cannot
 * lose typing, because the "unsaved changes" notice is on screen the whole time it is true
 * and the rows are re-read from R2 on return.
 */
export default async function PricingPage() {
  if (!(await currentUser())) redirect('/admin/login');

  const { items } = await readPricing();

  return (
    <div className={`${adminColumn} flex flex-col gap-6 py-7 sm:py-9`}>
      <div className={`-mx-gutter flex items-center border-b px-gutter pb-3 ${adminDivider}`}>
        <Link href="/admin" className={`${adminTextLink} -ml-3 no-underline`}>
          <BackArrow />
          {adminText.project.back}
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className={adminH1}>{adminText.pricing.heading}</h1>
        <p className="text-[1.125rem] leading-[1.5] text-fg-strong">{adminText.pricing.intro}</p>
      </div>

      <PriceEditor items={items} />
    </div>
  );
}
