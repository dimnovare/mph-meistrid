'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';

import { logoutAction } from '@/app/admin/actions';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { adminColumn, adminTextLink } from '@/components/admin/styles';
import { Logo } from '@/components/brand/Logo';
import { adminText } from '@/content/admin-text';
import { site } from '@/content/site';

/**
 * The admin's only chrome: where he is, and the way out.
 *
 * A client component solely because logging out is confirmed first — a mis-tap on "Logi
 * välja" mid-edit would cost him everything he had typed. The form underneath is a real
 * `<form action={logoutAction}>`, so it still works if the confirmation never gets its
 * JavaScript: the click handler intercepts, and if it cannot, the button just submits.
 *
 * The bar spans the page while its contents ride the same 900px column as everything below
 * it, so on the office computer the wordmark and „Logi välja“ line up with the content
 * rather than floating off at the window edges.
 */

/**
 * The ET / RU flag switcher the design board adds to this header (board 1e, handoff §8) is
 * built below but **not rendered**, and this constant is why.
 *
 * Switching the admin to Russian requires a Russian counterpart to `src/content/admin-text.ts`,
 * and there isn't one — that file is Estonian-only by decision, and every string in it was
 * written for one Estonian-speaking reader. A visible switcher with nothing behind it would
 * either do nothing when pressed or half-translate the screen, and on this admin in
 * particular a control that does not do what it says is worse than no control at all.
 *
 * So the chips ship dark. Write the Russian string set, thread a locale through, and flip
 * this to `true`; the markup and its states are already here and already match the board.
 * Annotated as `boolean` rather than left to infer `false`, so nothing below is compiled
 * away as unreachable while it waits.
 */
const LANGUAGE_SWITCHER_ENABLED: boolean = false;

export function AdminHeader() {
  const formRef = useRef<HTMLFormElement>(null);
  const [asking, setAsking] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b-2 border-fg-strong bg-page">
      <div className={`${adminColumn} flex min-h-16 items-center justify-between gap-4 py-2`}>
        {/* Doubles as the way back to the dashboard from every other screen. */}
        <Link
          href="/admin"
          aria-label={site.shortName}
          className="-mx-2 inline-flex min-h-14 items-center rounded-panel px-2 transition-colors hover:bg-surface-2"
        >
          <Logo variant="horizontal" height={24} />
        </Link>

        <div className="flex items-center gap-2">
          {LANGUAGE_SWITCHER_ENABLED ? <AdminLangSwitch /> : null}

          <form ref={formRef} action={logoutAction}>
            <button
              type="submit"
              onClick={(event) => {
                event.preventDefault();
                setAsking(true);
              }}
              className={`${adminTextLink} text-[1rem]`}
            >
              {adminText.login.logout.label}
            </button>
          </form>
        </div>
      </div>

      <ConfirmDialog
        open={asking}
        // Signing out is reversible — he has the password — so the confirm button is the ink
        // fill, not the red reserved for things that cannot be undone. The order is still
        // inverted: „Jää sisse“ is the one under the thumb.
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

/**
 * Estonian and Russian as three-stripe chips, drawn rather than set in emoji or fetched as
 * images: an emoji flag renders as two letters on most Android builds, and an image is a
 * request for 26×18 pixels.
 *
 * The six stripe colours are the two national flag specifications, which are facts about the
 * flags and not additions to the palette — everything that *is* a design decision here (the
 * borders, the inactive treatment, the hit area) uses tokens. The inset keyline is what stops
 * the white stripes from dissolving into the white header.
 *
 * Hit area is 56px on the button, not on the chip, per §9 — the chip stays 26×18 so it reads
 * as a flag rather than as a coloured button.
 */
function AdminLangSwitch() {
  return (
    <div className="flex items-center gap-1">
      <FlagChip
        active
        label="Eesti keeles"
        stripes={['#0072CE', '#161616', '#FFFFFF']}
        onSelect={() => {}}
      />
      <FlagChip
        active={false}
        label="По-русски"
        stripes={['#FFFFFF', '#0039A6', '#D52B1E']}
        onSelect={() => {}}
      />
    </div>
  );
}

function FlagChip({
  active,
  label,
  stripes,
  onSelect,
}: {
  active: boolean;
  label: string;
  stripes: [string, string, string];
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onSelect}
      className="inline-flex size-14 items-center justify-center rounded-panel transition-colors hover:bg-surface-2"
    >
      <span
        className={`flex flex-col overflow-hidden border-2 transition-colors ${
          active ? 'border-ink' : 'border-line opacity-55 grayscale-[55%]'
        }`}
        style={{ width: 30, height: 22 }}
      >
        <span
          aria-hidden="true"
          className="flex flex-1 flex-col"
          style={{ boxShadow: 'inset 0 0 0 1px rgb(27 29 31 / 0.12)' }}
        >
          {stripes.map((stripe) => (
            <span key={stripe} className="flex-1" style={{ background: stripe }} />
          ))}
        </span>
      </span>
    </button>
  );
}
