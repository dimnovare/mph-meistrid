'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';

import { logoutAction } from '@/app/admin/actions';
import { ConfirmDialog, adminControl } from '@/components/admin/ConfirmDialog';
import { adminText } from '@/content/admin-text';
import { site } from '@/content/site';

/**
 * The admin's only chrome: where he is, and the way out.
 *
 * A client component solely because logging out is confirmed first — a mis-tap on "Logi
 * välja" mid-edit would cost him everything he had typed. The form underneath is a real
 * `<form action={logoutAction}>`, so it still works if the confirmation never gets its
 * JavaScript: the click handler intercepts, and if it cannot, the button just submits.
 */
export function AdminHeader() {
  const formRef = useRef<HTMLFormElement>(null);
  const [asking, setAsking] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b-2 border-line-strong bg-page">
      <div className="mx-auto flex min-h-16 max-w-form items-center justify-between gap-4 px-gutter py-2">
        {/* Doubles as the way back to the dashboard from every other screen. */}
        <Link href="/admin" className="font-display text-[1.25rem] font-bold text-fg-strong">
          {site.shortName}
        </Link>

        <form ref={formRef} action={logoutAction}>
          <button
            type="submit"
            onClick={(event) => {
              event.preventDefault();
              setAsking(true);
            }}
            className={`${adminControl} px-4`}
          >
            {adminText.login.logout.label}
          </button>
        </form>
      </div>

      <ConfirmDialog
        open={asking}
        // Signing out is reversible — he has the password — so the confirm button is the
        // normal accent fill, not the red reserved for things that cannot be undone.
        tone="neutral"
        title={adminText.login.logout.confirmTitle}
        body={adminText.login.logout.confirmBody}
        confirmLabel={adminText.login.logout.confirm}
        cancelLabel={adminText.login.logout.cancel}
        onCancel={() => setAsking(false)}
        onConfirm={() => {
          setAsking(false);
          formRef.current?.requestSubmit();
        }}
      />
    </header>
  );
}
