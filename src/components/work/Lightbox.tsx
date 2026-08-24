'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type TouchEvent,
} from 'react';

/**
 * Full-screen photo viewer, built on the native `<dialog>` element (docs/design-system.md
 * §7.5).
 *
 * `<dialog>.showModal()` is doing most of the work here, which is the whole point of the
 * spec's choice: the browser gives us the focus trap, `Esc`-to-close, top-layer stacking
 * above every `z-index` on the page, `::backdrop`, and — critically for this site — it makes
 * the rest of the document inert, so the fixed mobile call bar (§7.11) cannot be tapped
 * through the overlay without us shipping a single line of `inert` bookkeeping.
 *
 * What the browser does NOT give us, and what the code below therefore has to do, is:
 * arrow-key navigation, swipe, the thumbnail strip, body scroll locking, and reliable focus
 * restoration. Everything else is markup.
 */

/** One photo, resolved on the server. */
export type LightboxImage = {
  id: string;
  /**
   * Extension-less R2 URL — `media/projects/{projectId}/{imageId}`. `src/lib/image-loader.ts`
   * appends `-{width}.webp`. It is resolved on the server because `publicUrl()` lives behind
   * `server-only`, so the URL has to arrive here as a plain string prop.
   */
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
  alt: string;
};

type OpenAt = (index: number, trigger: HTMLElement) => void;

/**
 * The grid itself is a Server Component (see Gallery.tsx) and is passed in as `children`.
 * Context is what lets a server-rendered thumbnail reach the client-side open handler
 * without the grid having to become a Client Component too.
 */
const OpenLightboxContext = createContext<OpenAt | null>(null);

/**
 * The interactive skin around one server-rendered thumbnail.
 *
 * Deliberately has no accessible name of its own: the `<img>` inside carries the real alt
 * text, which becomes the button's accessible name. Naming the button as well would make a
 * screen reader read the photo description twice.
 */
export function GalleryThumb({
  index,
  className = '',
  children,
}: {
  index: number;
  className?: string;
  children: ReactNode;
}) {
  const openAt = useContext(OpenLightboxContext);

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      // `currentTarget`, not `target`: the click lands on the <img>, but the element we must
      // hand focus back to when the dialog closes is the button.
      onClick={(event) => openAt?.(index, event.currentTarget)}
      className={className}
    >
      {children}
    </button>
  );
}

export function Lightbox({
  images,
  title,
  children,
}: {
  images: LightboxImage[];
  /** Accessible name of the dialog. The project title, for want of a dedicated key. */
  title: string;
  /** The server-rendered thumbnail grid. */
  children: ReactNode;
}) {
  const t = useTranslations('work.gallery');

  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const stripRef = useRef<HTMLUListElement | null>(null);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);

  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const total = images.length;

  const openAt = useCallback<OpenAt>((next, trigger) => {
    triggerRef.current = trigger;
    setIndex(next);
    setOpen(true);
  }, []);

  /**
   * Wraps rather than clamps. Clamping would mean disabling "previous" on the first photo,
   * and a `disabled` button drops keyboard focus to the document body mid-gallery — the user
   * is then tabbing from the top of the page again. Wrapping keeps both controls live and
   * focus where it is; the counter tells the user where they are.
   */
  const go = useCallback(
    (delta: number) => {
      setIndex((current) => (current + delta + total) % total);
    },
    [total],
  );

  const close = useCallback(() => {
    dialogRef.current?.close();
    // Drop the flag here too, rather than waiting for the `close` event. `close()` fires that
    // event from a queued task, so relying on it alone leaves the body locked and focus
    // stranded for a frame or more. Setting the state twice is a no-op; the listener below
    // still has to exist, because `Esc` closes the dialog without ever passing through here.
    setOpen(false);
  }, []);

  /* ---------------------------------------------------------------- open / close */

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;

    // `showModal()`, never `show()`. Only the modal form enters the top layer, and the top
    // layer is what buys the focus trap, the inert background and `::backdrop`.
    if (!dialog.open) dialog.showModal();

    // Catches every way out of the dialog that does not go through `close()` above — chiefly
    // `Esc`, which raises `cancel` and then `close` entirely inside the browser.
    const syncClosed = () => setOpen(false);
    dialog.addEventListener('close', syncClosed);

    return () => {
      // Detach first, then close: the cleanup's own `close()` must not bounce back through
      // the listener and set state during teardown.
      dialog.removeEventListener('close', syncClosed);
      if (dialog.open) dialog.close();
    };
  }, [open]);

  /**
   * Return focus to the thumbnail that opened the viewer.
   *
   * Browsers do restore focus after `<dialog>` closes, but only when the trigger is still
   * attached and still focusable, and the behaviour has historically differed between
   * engines. Doing it ourselves is three lines and removes the failure where a keyboard user
   * closes the tenth photo and is dumped back at the top of the document, having lost their
   * place in the grid.
   *
   * `preventScroll` because the scroll position has just been restored by the effect below;
   * letting the browser scroll again would fight it, and `html { scroll-behavior: smooth }`
   * would animate the fight.
   */
  useEffect(() => {
    if (open) return;
    const trigger = triggerRef.current;
    triggerRef.current = null;
    trigger?.focus({ preventScroll: true });
  }, [open]);

  /**
   * Body scroll lock.
   *
   * `overflow: hidden` on `<body>` is not enough — iOS Safari keeps scrolling the document
   * behind a fixed overlay. Pinning the body and offsetting it by the current scroll
   * position is the approach that holds everywhere; the offset is what stops the page
   * jumping to the top the instant the viewer opens, and the explicit `scrollTo` on the way
   * out is what puts the visitor back exactly where they were.
   */
  useEffect(() => {
    if (!open) return;

    const { body } = document;
    const scrollY = window.scrollY;
    const previousInlineStyle = body.style.cssText;
    // Pinning the body collapses the document's scroll height, so the desktop scrollbar
    // vanishes and the page underneath jumps ~15px wider. Paying that width back as padding
    // keeps the header and the grid exactly where they were.
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    return () => {
      body.style.cssText = previousInlineStyle;
      // `instant`, never the default: `html { scroll-behavior: smooth }` would otherwise
      // animate the page back to a position it never actually left, which reads as a glitch
      // and is exactly the scripted motion §10 rules out.
      window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' });
    };
  }, [open]);

  /* ---------------------------------------------------------------- navigation */

  function onKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    // `Esc` is missing on purpose — `<dialog>` handles it natively, and intercepting it here
    // would only risk breaking that.
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        go(-1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        go(1);
        break;
      case 'Home':
        event.preventDefault();
        setIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setIndex(total - 1);
        break;
      default:
        break;
    }
  }

  function onTouchStart(event: TouchEvent<HTMLDivElement>) {
    const touch = event.changedTouches[0];
    swipeRef.current = { x: touch.clientX, y: touch.clientY };
  }

  /**
   * Swipe is measured on `touchend` rather than tracked live, because tracking live would
   * mean dragging the image with the finger — a JS-driven transform, which §10 forbids.
   * A gesture counts only if it is decisively horizontal, so a vertical flick or a pinch
   * does not skip a photo.
   */
  function onTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start) return;

    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    if (Math.abs(dx) < 48 || Math.abs(dx) <= Math.abs(dy)) return;
    go(dx < 0 ? 1 : -1);
  }

  /** Clicking the dark margin around the photo closes; clicking the photo does not. */
  function onStageClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) close();
  }

  /* ---------------------------------------------------------------- thumbnail strip */

  // Keep the active thumbnail in view. `scrollIntoView` obeys the CSS `scroll-behavior` of
  // the strip, which `prefers-reduced-motion` in globals.css already forces to `auto`.
  useEffect(() => {
    if (!open) return;
    stripRef.current
      ?.querySelector<HTMLElement>('[data-current="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [index, open]);

  /**
   * Only the current photo and its two neighbours are mounted, which is what "only the
   * adjacent images are preloaded" means in practice — an unmounted `<Image>` issues no
   * request. Keying by image id (not by position) means a photo that stays in the window as
   * the index moves keeps its DOM node and is never re-fetched.
   */
  const mounted = useMemo(() => {
    if (total === 0) return [];
    return [...new Set([(index - 1 + total) % total, index, (index + 1) % total])];
  }, [index, total]);

  const chrome =
    'flex items-center justify-center rounded-control border border-white/28 bg-white/12 ' +
    'text-white transition-colors duration-fast ease-out hover:bg-white/20';

  return (
    <OpenLightboxContext.Provider value={openAt}>
      {children}

      <dialog
        ref={dialogRef}
        aria-label={title}
        onKeyDown={onKeyDown}
        className={[
          // A `<dialog>` is `display: none` until it carries `[open]`, so `open:flex` is what
          // reveals it — there is no `hidden` class to toggle and no state to get wrong.
          'fixed inset-0 m-0 h-full max-h-none w-full max-w-none flex-col bg-transparent p-0 open:flex',
          // `on-ink` flips the global focus ring to `focus-on-ink`; an ink ring would be
          // invisible against the near-black backdrop.
          'on-ink text-on-ink',
          // §7.5: backdrop rgb(20 18 15 / 0.92) — that is `fg-strong` at 92% — fading in over
          // 180ms. `@starting-style` is the only way to transition an element that goes from
          // `display: none` to shown; reduced motion clamps the 180ms to 1ms in globals.css.
          'backdrop:bg-fg-strong/92 backdrop:transition-opacity backdrop:duration-base backdrop:ease-out starting:backdrop:opacity-0',
        ].join(' ')}
      >
        {open && total > 0 ? (
          <>
            {/* First focusable child, so `showModal()` lands focus here without an autofocus
                attribute. 48x48 at a 16px inset, per §7.5. */}
            <button
              type="button"
              onClick={close}
              aria-label={t('close')}
              className={`absolute right-4 top-4 z-10 size-12 ${chrome}`}
            >
              <CloseIcon />
            </button>

            {total > 1 ? (
              <>
                {/* 56x56, 16px from the edge, vertically centred with auto margins rather
                    than a translate — §7.4 reserves the site's only transform for the card
                    image hover. Hidden below 768px, where swipe and the strip take over. */}
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label={t('prev')}
                  className={`absolute inset-y-0 left-4 z-10 my-auto hidden size-14 md:flex ${chrome}`}
                >
                  <ChevronIcon direction="left" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label={t('next')}
                  className={`absolute inset-y-0 right-4 z-10 my-auto hidden size-14 md:flex ${chrome}`}
                >
                  <ChevronIcon direction="right" />
                </button>
              </>
            ) : null}

            {/* Stage. `min-h-0` lets this flex child shrink below the photo's intrinsic
                height instead of pushing the counter and strip off the bottom of the screen. */}
            <div
              // `pan-y pinch-zoom` hands horizontal gestures to the swipe handler below while
              // leaving pinch-to-zoom alone — on a phone that is how a visitor inspects the
              // grout line they are actually here to look at.
              className="relative flex min-h-0 flex-1 touch-pan-y touch-pinch-zoom"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {mounted.map((position) => {
                const image = images[position];
                const isCurrent = position === index;

                return (
                  <div
                    key={image.id}
                    aria-hidden={!isCurrent}
                    onClick={onStageClick}
                    className={[
                      // Padding clears the chrome: 64px at the top for the close button,
                      // 96px each side on desktop for the arrows.
                      'absolute inset-0 flex items-center justify-center px-4 pb-4 pt-16 md:px-24 md:pt-20',
                      // The 120ms crossfade from §7.5. Opacity only — the neighbours stay
                      // mounted so switching photos never shows an empty frame.
                      'transition-opacity duration-fast ease-out',
                      isCurrent ? 'opacity-100' : 'pointer-events-none opacity-0',
                    ].join(' ')}
                  >
                    <Image
                      src={image.src}
                      alt={isCurrent ? image.alt : ''}
                      width={image.width}
                      height={image.height}
                      sizes="100vw"
                      // Eager because these three are the point of the screen; lazy would
                      // stall the neighbour until the user had already asked for it.
                      loading="eager"
                      // `blurDataURL` is generated for exactly this moment (see
                      // `src/lib/types.ts`). §6.4 bans shimmer, not a placeholder.
                      placeholder="blur"
                      blurDataURL={image.blurDataURL}
                      // `contain`, never `cover`: §6.1 — do not crop the photo the visitor
                      // explicitly asked to see. `shadow-frame` keeps a blown-out white wall
                      // from bleeding into the backdrop, the same reason it exists on the grid.
                      className="h-auto max-h-full w-auto max-w-[min(100%,1600px)] object-contain shadow-frame"
                    />
                  </div>
                );
              })}
            </div>

            <div className="shrink-0 px-4 pb-4 pt-2">
              {/*
                The digits are duplicated on purpose. Sighted users get "3 / 12" in
                tabular-nums so the counter does not jitter as the number changes; screen
                readers get the localised sentence, which in Russian is "Фото 3 из 12" and has
                no slash in it at all. `aria-live` announces only the non-hidden half.
              */}
              <p
                aria-live="polite"
                className="text-center font-sans text-small font-semibold tabular-nums text-on-ink-muted"
              >
                <span aria-hidden="true">
                  {index + 1} / {total}
                </span>
                <span className="sr-only">{t('counter', { index: index + 1, total })}</span>
              </p>

              {total > 1 ? (
                <ul
                  ref={stripRef}
                  className="mt-2 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 md:hidden"
                >
                  {images.map((image, position) => {
                    const isCurrent = position === index;

                    return (
                      <li key={image.id} className="shrink-0 snap-center">
                        <button
                          type="button"
                          data-current={isCurrent}
                          aria-current={isCurrent ? 'true' : undefined}
                          aria-label={image.alt}
                          onClick={() => setIndex(position)}
                          className={`block size-14 overflow-hidden border-2 ${
                            isCurrent ? 'border-accent' : 'border-ink-line'
                          }`}
                        >
                          <Image
                            src={image.src}
                            alt=""
                            width={56}
                            height={56}
                            sizes="56px"
                            // Lazy is load-bearing rather than lazy: above 768px this strip is
                            // `display: none`, and a lazy image inside a hidden container is
                            // never fetched. Desktop therefore pays nothing for it.
                            loading="lazy"
                            className="size-full object-cover"
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          </>
        ) : null}
      </dialog>
    </OpenLightboxContext.Provider>
  );
}

/* ------------------------------------------------------------------ icons */

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
    >
      <path d="M4 4l12 12M16 4L4 16" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
    >
      <path d={direction === 'left' ? 'M14 3L6 11l8 8' : 'M8 3l8 8-8 8'} />
    </svg>
  );
}
