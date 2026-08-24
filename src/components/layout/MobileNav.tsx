'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/Button';
import { telHref } from '@/content/site';
import { Link, usePathname } from '@/i18n/navigation';

import { LangSwitch } from './LangSwitch';

/**
 * Every part of the header that has to run in the browser, in one `'use client'` module:
 * the sticky shell (scroll shadow + active-section marking) and the full-screen mobile menu.
 *
 * They live together on purpose. `'use client'` is a file-level directive, so splitting them
 * would either force `Header.tsx` to become a client component — dragging the whole header,
 * the logo and both buttons into the client bundle — or add a third client chunk for eight
 * lines of observer code. One module keeps `Header.tsx` a server component and ships one
 * small chunk. Nothing here renders copy of its own except through `useTranslations`.
 */

/** Must match the `id` on the element rendered by `./CallBar`. */
const CALL_BAR_ID = 'mph-call-bar';

const PANEL_ID = 'mph-mobile-menu';

/**
 * A thin band a quarter of the way down the viewport, used as the "reading line": whichever
 * section is crossing it is the one the visitor is looking at. Sections are contiguous, so
 * once the first one is reached something is always crossing — no scroll maths, no layout
 * reads per frame, and nothing at all until the observer first fires.
 */
const READING_BAND = '-25% 0px -65% 0px';

type NavItem = { id: string; label: string };

/* -------------------------------------------------------------------------- *
 * Sticky shell
 * -------------------------------------------------------------------------- */

export function HeaderShell({ children }: { children: ReactNode }) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Scroll shadow. A 1px sentinel sitting above the header tells us whether the page is at
  // the top; a scroll listener would fire on every frame and tempt someone into reading
  // `scrollY`, which is a forced synchronous layout on the main thread.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Active-section marking. Re-runs on navigation because the header lives in the layout and
  // survives route changes: without `pathname` in the deps, opening a project page would
  // leave the observers watching detached nodes and a nav item stuck highlighted.
  useEffect(() => {
    const header = headerRef.current;
    if (!header || typeof IntersectionObserver === 'undefined') return;

    const links = Array.from(
      header.querySelectorAll<HTMLAnchorElement>('[data-nav-section]'),
    );
    const sections = links
      .map((link) => document.getElementById(link.dataset.navSection ?? ''))
      .filter((section): section is HTMLElement => section !== null);

    // Project pages carry none of the landing page's sections; nothing is highlighted there.
    if (sections.length === 0) return;

    const crossing = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) crossing.add(entry.target.id);
          else crossing.delete(entry.target.id);
        }

        // Two sections can straddle the band at once. The later one in document order is the
        // one being scrolled into, so it wins.
        let activeId: string | null = null;
        for (const section of sections) {
          if (crossing.has(section.id)) activeId = section.id;
        }

        for (const link of links) {
          if (link.dataset.navSection === activeId) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        }
      },
      { rootMargin: READING_BAND, threshold: 0 },
    );

    for (const section of sections) observer.observe(section);

    return () => {
      observer.disconnect();
      for (const link of links) link.removeAttribute('aria-current');
    };
  }, [pathname]);

  return (
    <>
      {/*
        The sentinel. `-mb-px` cancels the 1px it would otherwise add above the header, so it
        costs nothing in layout; the header paints over it. Marked aria-hidden because it is
        pure machinery.
      */}
      <div ref={sentinelRef} aria-hidden="true" className="-mb-px h-px" />

      <header
        ref={headerRef}
        // Written as a data attribute rather than a conditional class so the styling stays in
        // the markup with every other class, and so the state is visible in devtools.
        data-scrolled={scrolled ? 'true' : 'false'}
        className={
          'sticky top-0 z-40 h-header border-b border-line bg-page transition-shadow ' +
          'duration-fast data-[scrolled=true]:shadow-raise lg:h-header-lg'
        }
      >
        {children}
      </header>
    </>
  );
}

/* -------------------------------------------------------------------------- *
 * Full-screen mobile menu
 * -------------------------------------------------------------------------- */

/** Everything the browser will let a user reach with Tab. */
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

type MobileNavProps = {
  /** Same list the desktop nav renders, already translated by the server component. */
  items: NavItem[];
  /** Locale-correct link to the contact section, e.g. `/#kontakt` or `/ru#kontakt`. */
  contactHref: string;
};

export function MobileNav({ items, contactHref }: MobileNavProps) {
  const t = useTranslations('a11y');
  const tCommon = useTranslations('common');

  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<(() => void) | null>(null);

  // The background lock is applied and released imperatively rather than from a `useEffect`
  // cleanup. A menu row is a same-page hash link: the browser scrolls to the target as the
  // default action of the click, and a passive effect cleanup runs after that, so the page
  // would still be `overflow: hidden` at the moment of the jump and the jump would be lost.
  const lockBackground = useCallback(() => {
    if (restoreRef.current) return;

    const body = document.body;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    // The call bar is painted under the panel but is still tabbable and still announced.
    // `inert` takes it out of both for as long as the menu covers it.
    const callBar = document.getElementById(CALL_BAR_ID);
    if (callBar) callBar.inert = true;

    restoreRef.current = () => {
      body.style.overflow = previousOverflow;
      if (callBar) callBar.inert = false;
    };
  }, []);

  const openMenu = useCallback(() => {
    lockBackground();
    setOpen(true);
  }, [lockBackground]);

  const closeMenu = useCallback(() => {
    restoreRef.current?.();
    restoreRef.current = null;
    setOpen(false);
    // `preventScroll` matters: the menu button sits in the sticky header, and focusing it
    // normally would scroll it into view — i.e. back to the top of the page, cancelling the
    // jump to the section the visitor just tapped.
    buttonRef.current?.focus({ preventScroll: true });
  }, []);

  // Insurance only: the header never unmounts in this layout, but a lock that outlives its
  // component would leave the whole page unscrollable with nothing on screen to explain it.
  useEffect(() => () => restoreRef.current?.(), []);

  // Move focus into the panel when it opens, so a keyboard user lands in the menu rather
  // than behind it.
  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        return;
      }
      if (event.key !== 'Tab') return;

      // The X is the menu button, which lives in the header *outside* the panel, so the trap
      // is [button, ...panel] and not just the panel — otherwise Tab would walk straight out
      // into the page behind the menu.
      const inPanel = panelRef.current
        ? Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
        : [];
      const order = buttonRef.current ? [buttonRef.current, ...inPanel] : inPanel;
      if (order.length === 0) return;

      const first = order[0];
      const last = order[order.length - 1];
      const active = document.activeElement as HTMLElement | null;

      // Focus can be somewhere else entirely — a click on the logo, or the browser handing it
      // back after an alt-tab. Pulling it in is what makes this a trap and not a wrap-around.
      if (!active || !order.includes(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus({ preventScroll: true });
        return;
      }

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    }

    // The panel is `display: none` from 1024px up. If the viewport crosses that line while
    // the menu is open, the lock would survive with nothing on screen to close.
    const wide = window.matchMedia('(min-width: 64rem)');
    function onBreakpoint() {
      if (wide.matches) closeMenu();
    }

    document.addEventListener('keydown', onKeyDown);
    wide.addEventListener('change', onBreakpoint);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      wide.removeEventListener('change', onBreakpoint);
    };
  }, [open, closeMenu]);

  const callHref = telHref();

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={PANEL_ID}
        aria-label={open ? t('menuClose') : t('menuOpen')}
        onClick={() => (open ? closeMenu() : openMenu())}
        className={
          'inline-flex size-tap items-center justify-center rounded-control text-fg-strong ' +
          'transition-colors hover:bg-surface-2 lg:hidden'
        }
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>

      {/*
        A full-screen panel rather than a slide-out drawer: thumb-sized rows, no width to get
        wrong, and no transform on an ancestor to break the fixed positioning. It starts below
        the header so the X stays visible and tappable.
      */}
      <div
        ref={panelRef}
        id={PANEL_ID}
        hidden={!open}
        className={
          'fixed inset-x-0 bottom-0 top-header z-50 overflow-y-auto overscroll-contain ' +
          'bg-page lg:hidden'
        }
      >
        <nav>
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={{ pathname: '/', hash: item.id }}
                  onClick={closeMenu}
                  className={
                    'flex min-h-14 items-center border-b border-line px-gutter text-lead ' +
                    'font-semibold text-fg-strong transition-colors hover:bg-surface'
                  }
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* 24px of breathing room *plus* the home-indicator inset, so the last button is
            never half under an iPhone's gesture bar. */}
        <div className="flex flex-col gap-3 px-gutter pb-[calc(1.5rem_+_env(safe-area-inset-bottom))] pt-6">
          <Button as="a" href={contactHref} onClick={closeMenu} className="w-full">
            {tCommon('ctaQuote')}
          </Button>

          {/*
            No phone number yet means no `tel:` href. A dead `tel:` link is worse than no
            link — it looks tappable and does nothing — so the control points at the contact
            section instead, which is where the number will be.
          */}
          <Button
            as="a"
            variant="secondary"
            href={callHref ?? contactHref}
            onClick={closeMenu}
            className="w-full"
          >
            {tCommon('ctaCall')}
          </Button>

          <div className="pt-2">
            <LangSwitch tone="light" />
          </div>
        </div>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- *
 * Icons — inlined rather than pulled from a library: two paths beat a dependency.
 * -------------------------------------------------------------------------- */

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
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
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
