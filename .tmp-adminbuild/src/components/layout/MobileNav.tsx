'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';

import { actionClasses, FRAME } from '@/components/sections/styles';
import { Link } from '@/i18n/navigation';

/**
 * The mobile navigation: a hamburger in the header bar and a dropdown panel under it.
 *
 * A dropdown, not the full-screen overlay this used to be. The panel is short — five links
 * and one button — and a sheet that covers the page for six rows costs a focus trap, a
 * background scroll lock and an `inert` dance with the call bar, all to hide content the
 * visitor can already see. Absolutely positioned under the sticky header, it overlays
 * instead of pushing, so opening the menu never moves the page under the reader's thumb.
 *
 * `position: absolute` resolves against the `<header>`, which is `sticky` and therefore
 * already a containing block — the frame div in between is `static` on purpose, so the panel
 * spans the full header width rather than the padded content width.
 *
 * Any tap inside closes it, which is what the prototype does: every element in there is
 * either a link that navigates or the button that submits nothing. Escape closes it too, and
 * so does crossing back above 720px, where the panel is `display: none` and would otherwise
 * be left open with nothing on screen to close it.
 *
 * This is one of the three client components on the public site. Nothing here renders copy of
 * its own — the labels arrive already translated from the server component above it.
 */

const PANEL_ID = 'mph-mobile-menu';

type NavItem = { id: string; label: string };

type Props = {
  /** The same list the desktop nav renders, translated by the server component. */
  items: NavItem[];
  /** Locale-correct link to the contact section, e.g. `/#kontakt` or `/ru#kontakt`. */
  contactHref: string;
};

export function MobileNav({ items, contactHref }: Props) {
  const t = useTranslations('a11y');
  const tCommon = useTranslations('common');

  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setOpen(false);
      // `preventScroll` matters: the button sits in the sticky header, and focusing it
      // normally would scroll it into view — i.e. back to the top of the page.
      buttonRef.current?.focus({ preventScroll: true });
    }

    const wide = window.matchMedia('(min-width: 45rem)');
    function onBreakpoint() {
      if (wide.matches) setOpen(false);
    }

    document.addEventListener('keydown', onKeyDown);
    wide.addEventListener('change', onBreakpoint);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      wide.removeEventListener('change', onBreakpoint);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={PANEL_ID}
        aria-label={open ? t('menuClose') : t('menuOpen')}
        onClick={() => setOpen((current) => !current)}
        className="-mr-2.5 flex size-tap items-center justify-center text-ink min-[45rem]:hidden"
      >
        {open ? <CloseIcon /> : <BurgerIcon />}
      </button>

      <div
        id={PANEL_ID}
        hidden={!open}
        onClick={close}
        className="absolute inset-x-0 top-full border-b border-line bg-page min-[45rem]:hidden"
      >
        <div className={`${FRAME} pb-5`}>
          <nav>
            <ul>
              {items.map((item, index) => (
                <li key={item.id}>
                  <Link
                    href={{ pathname: '/', hash: item.id }}
                    className={
                      'flex min-h-14 items-center text-body font-semibold text-fg-strong ' +
                      'transition-colors duration-fast hover:text-fg-muted ' +
                      (index < items.length - 1 ? 'border-b border-line' : '')
                    }
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <a href={contactHref} className={`${actionClasses('ink')} mt-2 w-full`}>
            {tCommon('ctaQuote')}
          </a>
        </div>
      </div>
    </>
  );
}

/* Icons — inlined rather than pulled from a library: two shapes beat a dependency. The
   burger is drawn as three 22x2.5px bars rather than as a stroked path, because a 2.5px
   stroke on a 24-unit viewBox rounds to 2px or 3px depending on the device pixel ratio. */

function BurgerIcon() {
  return (
    <span aria-hidden="true" className="flex w-[22px] flex-col gap-[5px]">
      <span className="h-[2.5px] w-full bg-current" />
      <span className="h-[2.5px] w-full bg-current" />
      <span className="h-[2.5px] w-full bg-current" />
    </span>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
