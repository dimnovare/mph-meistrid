'use client';

import Script from 'next/script';
import { useTranslations } from 'next-intl';
import { useActionState, useEffect, useRef, useState, type ChangeEvent } from 'react';

import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Field';
import { isPlaceholder, site } from '@/content/site';
import { submitQuoteAction } from '@/app/quote-action';
import { FileTooLargeError, prepareForUpload } from '@/lib/client-image';
import { MAX_QUOTE_PHOTOS } from '@/lib/quote-limits';

/**
 * Quote form — design-system.md §7.10.
 *
 * The only client component on the landing page, and it needs the boundary for four things
 * that cannot happen on the server: downscaling photos in the browser before they are sent,
 * previewing them from object URLs, driving the Turnstile widget, and holding the pending
 * state of the Server Action.
 */

/*
 * Limits come from `src/lib/quote-limits.ts`, which the Server Action imports too. They used
 * to be declared separately in each place and drifted: the form promised 4 MB per photo
 * while the server refused anything over 1.2 MB, so an ordinary 2 MB photo passed the form's
 * own check and was then rejected with a different message.
 *
 * The catalogue no longer quotes a megabyte figure at all. Every photo is downscaled by
 * `src/lib/client-image.ts` before it is attached, so size is not something a visitor can
 * meaningfully act on — telling them a number would only invite them to compare it against
 * the file size their phone shows, which is the pre-downscale one.
 */

type Attachment = {
  key: string;
  blob: Blob;
  filename: string;
  /** Object URL for the preview. Must be revoked or a phone gallery session leaks memory. */
  previewUrl: string;
};

/**
 * The catalogue carries developer-owned `{{TOKENS}}` (docs/CONTENT.md 1.5) that no longer
 * have an ICU argument to bind to — they are ICU-escaped literals. Substituting the real
 * constant is what those tokens are *for*; an unknown token is left visible rather than
 * blanked, so an unfinished value stays obvious instead of silently disappearing.
 */
function fill(text: string, values: Record<string, string | null>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (token, key: string) => values[key] ?? token);
}

export function QuoteForm() {
  const t = useTranslations('quote');
  const [state, formAction, isPending] = useActionState(submitQuoteAction, {});

  const [photos, setPhotos] = useState<Attachment[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Read inside the unmount cleanup, which would otherwise close over the empty first render.
  // Kept in sync from an effect rather than during render: a ref written while rendering is
  // not a legal React value read.
  const photosRef = useRef<Attachment[]>([]);
  // Monotonic list key. Two photos can share a filename, and the same file can be removed
  // and picked again, so neither the name nor the index is stable enough on its own.
  const keySeq = useRef(0);

  // Inlined at build time, so an absent key means the widget is not in the bundle at all and
  // the form still works — which is the correct behaviour for a local dev run.
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const phone = isPlaceholder(site.phoneDisplay) ? null : site.phoneDisplay;
  const tokens = {
    PHONE: phone,
    MAX_UPLOAD_COUNT: String(MAX_QUOTE_PHOTOS),
  };

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    return () => {
      for (const photo of photosRef.current) URL.revokeObjectURL(photo.previewUrl);
    };
  }, []);

  // §7.10: on submit failure, move focus to the first invalid field. Without this a phone
  // user is left staring at the submit button with the error scrolled off screen.
  useEffect(() => {
    if (!state.field) return;
    document.getElementById(`quote-${state.field}`)?.focus();
  }, [state]);

  // A Turnstile token is single-use. After a rejected submit the stale token would fail
  // verification again, so the widget is reset for the retry.
  useEffect(() => {
    if (!state.error || !siteKey) return;
    (window as unknown as { turnstile?: { reset: () => void } }).turnstile?.reset();
  }, [state, siteKey]);

  // The previews leave the screen when the form is replaced by the thank-you block, so their
  // object URLs are released there and then. The state array is left alone — revoking twice
  // (here and again on unmount) is a no-op, and clearing state from an effect would only
  // cause an extra render nobody sees.
  useEffect(() => {
    if (!state.ok) return;
    for (const photo of photosRef.current) URL.revokeObjectURL(photo.previewUrl);
  }, [state.ok]);

  async function onPickPhotos(event: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    // Reset the control so removing a photo and picking the same file again still fires.
    event.target.value = '';
    if (picked.length === 0) return;

    setPhotoError(null);

    const room = MAX_QUOTE_PHOTOS - photos.length;
    if (room <= 0) {
      setPhotoError(fill(t('errors.tooManyFiles'), tokens));
      return;
    }

    const accepted: Attachment[] = [];
    let failure: string | null = picked.length > room ? fill(t('errors.tooManyFiles'), tokens) : null;

    for (const file of picked.slice(0, room)) {
      try {
        // Downscales to 2400px / JPEG q0.82 *before* anything is queued, so the preview is
        // the exact bytes that will be attached and a 6 MB phone photo becomes ~500 KB.
        const prepared = await prepareForUpload(file);
        keySeq.current += 1;
        accepted.push({ key: `photo-${keySeq.current}`, ...prepared });
      } catch (err) {
        failure = fill(
          t(err instanceof FileTooLargeError ? 'errors.fileTooBig' : 'errors.fileType'),
          tokens,
        );
      }
    }

    if (accepted.length > 0) setPhotos((current) => [...current, ...accepted]);
    if (failure) setPhotoError(failure);
  }

  function removePhoto(key: string) {
    // Revoked here rather than inside the updater: a setState updater has to stay pure, and
    // React is free to call it more than once.
    const photo = photos.find((p) => p.key === key);
    if (photo) URL.revokeObjectURL(photo.previewUrl);
    setPhotos((current) => current.filter((p) => p.key !== key));
    setPhotoError(null);
  }

  const fieldError = (field: 'name' | 'phone' | 'email') =>
    state.field === field ? state.error : undefined;

  // A field-level error is already announced by the `role="alert"` inside `Field`; repeating
  // it in the form-level region would make a screen reader say it twice.
  const formError = state.error && !state.field ? state.error : undefined;

  return (
    <div>
      <h3 className="font-display text-h3">{t('heading')}</h3>
      <p className="mt-3 text-body text-fg-muted">{t('intro')}</p>

      {/*
        Both live regions are in the DOM from first render, empty. A region inserted at the
        same moment it gains content is announced unreliably; one that is already there is
        announced every time.
      */}
      <div role="status" aria-live="polite">
        {state.ok ? (
          <div className="mt-6 rounded-control border-l-[3px] border-success bg-success-soft px-5 py-4">
            <p className="flex items-start gap-3 font-sans font-semibold text-fg-strong">
              <CheckIcon />
              {t('success.title')}
            </p>
            <p className="mt-2 text-small text-fg">{fill(t('success.body'), tokens)}</p>
          </div>
        ) : null}
      </div>

      <div role="alert">
        {formError ? (
          <div className="mt-6 rounded-control border-l-[3px] border-danger bg-danger-soft px-5 py-4">
            <p className="flex items-start gap-3 text-small text-fg-strong">
              <WarningIcon />
              {formError}
            </p>
          </div>
        ) : null}
      </div>

      {state.ok ? null : (
        <form
          // `formData` is built from the form, then the downscaled blobs are appended. The
          // file input itself is deliberately unnamed: if it were named, the browser would
          // also serialise the *originals* and blow the 4 MB Server Action body limit.
          action={(formData) => {
            for (const photo of photos) formData.append('photos', photo.blob, photo.filename);
            formAction(formData);
          }}
          className="relative mt-8 flex flex-col gap-6"
        >
          <Field id="quote-name" label={t('name.label')} required error={fieldError('name')}>
            <Input
              id="quote-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder={t('name.placeholder')}
              required
              aria-required="true"
              invalid={Boolean(fieldError('name'))}
              aria-describedby={fieldError('name') ? 'quote-name-error' : undefined}
            />
          </Field>

          <Field id="quote-phone" label={t('phone.label')} required error={fieldError('phone')}>
            {/* `type="tel"` + `inputmode` is what makes a phone show the dialling keypad. */}
            <Input
              id="quote-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder={t('phone.placeholder')}
              required
              aria-required="true"
              invalid={Boolean(fieldError('phone'))}
              aria-describedby={fieldError('phone') ? 'quote-phone-error' : undefined}
            />
          </Field>

          <Field
            id="quote-email"
            label={t('email.label')}
            hint={t('email.optional')}
            error={fieldError('email')}
          >
            <Input
              id="quote-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={t('email.placeholder')}
              invalid={Boolean(fieldError('email'))}
              aria-describedby={fieldError('email') ? 'quote-email-error' : undefined}
            />
          </Field>

          <Field id="quote-message" label={t('message.label')}>
            {/* §7.10: min-height 132px. */}
            <Textarea
              id="quote-message"
              name="message"
              rows={5}
              placeholder={t('message.placeholder')}
              className="min-h-33"
            />
          </Field>

          {/* Photos. A group rather than a single labelled control: the visible button is the
              file input's label, and the group carries the section name. */}
          <div role="group" aria-labelledby="quote-photos-label" className="flex flex-col gap-2">
            <span id="quote-photos-label" className="text-label uppercase text-fg">
              {t('photos.label')}
            </span>
            <p id="quote-photos-hint" className="text-small text-fg-muted">
              {fill(t('photos.hint'), tokens)}
            </p>

            <div className="mt-2">
              <input
                id="quote-photos"
                type="file"
                accept="image/*"
                multiple
                onChange={onPickPhotos}
                disabled={photos.length >= MAX_QUOTE_PHOTOS}
                aria-describedby="quote-photos-hint"
                // `sr-only`, not `hidden`: the input has to stay focusable so the keyboard
                // can reach it through its label.
                className="peer sr-only"
              />
              <label
                htmlFor="quote-photos"
                className={
                  'inline-flex h-control cursor-pointer items-center justify-center gap-2.5 ' +
                  'rounded-control border border-line-strong bg-page px-6 font-display ' +
                  'text-body font-bold text-fg-strong transition-colors hover:bg-surface-2 ' +
                  // The ring has to be drawn here because the real control is off-screen.
                  // Written long-hand so it matches the 3px ink ring in globals.css exactly.
                  'peer-focus-visible:[outline:3px_solid_var(--color-focus)] ' +
                  'peer-focus-visible:outline-offset-2 ' +
                  'peer-disabled:cursor-not-allowed peer-disabled:border-line ' +
                  'peer-disabled:bg-surface-2 peer-disabled:text-fg-muted'
                }
              >
                {t('photos.button')}
              </label>
            </div>

            {photos.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-3">
                {photos.map((photo) => (
                  <li
                    key={photo.key}
                    className="relative h-24 w-24 overflow-hidden border border-line bg-surface-2"
                  >
                    {/*
                      A plain <img>, not next/image: this is a local blob that exists for a
                      few seconds and must never touch the image pipeline or the R2 loader.
                    */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.previewUrl} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.key)}
                      aria-label={`${t('photos.remove')}: ${photo.filename}`}
                      className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center bg-[rgb(20_18_15_/_0.72)] text-white"
                    >
                      <CloseIcon />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <div role="alert">
              {photoError ? <p className="text-small text-danger">{photoError}</p> : null}
            </div>
          </div>

          {/*
            Honeypot. Off-screen rather than `display: none` or `hidden` — bots skip inputs
            that are actually hidden, which is the whole point of the field. `tabIndex={-1}`
            keeps a keyboard out of it and `aria-hidden` keeps a screen reader from reading
            it, so the only thing that ever fills it is a script.
          */}
          <div aria-hidden="true" className="absolute left-[-9999px] top-0 h-px w-px overflow-hidden">
            <label htmlFor="website">Website</label>
            <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          {siteKey ? (
            <>
              {/* Implicit rendering: the script finds `.cf-turnstile` on load and injects the
                  `cf-turnstile-response` input, which the Server Action reads. */}
              <div className="cf-turnstile" data-sitekey={siteKey} />
              <Script
                src="https://challenges.cloudflare.com/turnstile/v0/api.js"
                // The widget is never the reason a page is slow: it loads after everything
                // else, and the visitor is typing for several seconds before it is needed.
                strategy="lazyOnload"
              />
            </>
          ) : null}

          <div className="flex flex-col gap-4">
            <Button type="submit" variant="primary" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? t('submitting') : t('submit')}
            </Button>
            <p className="text-small text-fg-muted">{t('privacyNote')}</p>
          </div>
        </form>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ glyphs */
/* Inlined rather than an icon library: three shapes, zero payload, `currentColor`. */

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="mt-0.5 h-5 w-5 shrink-0 text-success"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="square"
    >
      <path d="M4 12.5 9.5 18 20 6.5" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="mt-0.5 h-5 w-5 shrink-0 text-danger"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
    >
      <path d="M12 3 22 20H2L12 3Z" />
      <path d="M12 10v5" />
      <path d="M12 17.5v.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="square"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
