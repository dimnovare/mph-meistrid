'use client';

import Script from 'next/script';
import { useTranslations } from 'next-intl';
import { useActionState, useEffect, useRef, useState, type ChangeEvent } from 'react';

import { Field } from '@/components/ui/Field';
import { isPlaceholder, site } from '@/content/site';
import { submitQuoteAction, type QuoteState } from '@/app/quote-action';
import { FileTooLargeError, prepareForUpload } from '@/lib/client-image';
import { MAX_QUOTE_PHOTOS } from '@/lib/quote-limits';

import { actionClasses, FIELD_CONTROL, INK_PANEL, UNDERLINE_LINK, UNDERLINE_RULE } from './styles';
import { Bricks, GLYPH_THREE } from './Bricks';

/**
 * Quote form — the prototype's Kontakt form, in the codebase's server-action plumbing.
 *
 * The only client component on the landing page, and it needs the boundary for five things
 * that cannot happen on the server: downscaling photos in the browser before they are sent,
 * previewing them from object URLs, driving the Turnstile widget, holding the pending state
 * of the Server Action, and remembering the sender's name for the confirmation panel.
 *
 * ── WHERE THIS DIVERGES FROM THE PROTOTYPE, AND WHY ─────────────────────────
 * The prototype's four fields are Nimi / Telefon või e-post / Objekti aadress / Kirjeldus.
 * The Server Action in `src/app/quote-action.ts` validates `name`, `phone`, `email`,
 * `message` and a honeypot, and that contract is not ours to change here — so the fields
 * are the action's, and the placeholders are the catalogue's. The address is folded into the
 * description field's own prompt rather than added as a field the server would discard.
 *
 * The prototype labels its fields with placeholders only. A placeholder disappears the
 * moment someone types, which on a phone means the visitor can no longer see what the field
 * was, so the real `<label htmlFor>` from `@/components/ui/Field` stays. What it does not
 * get is Field's `required` marker: that asterisk is painted `accent-strong`, and it would
 * be the only orange left on a site whose accent family the 5a identity retired. `required`
 * and `aria-required` stay on the controls themselves, so browsers and assistive technology
 * still know and still enforce.
 * ────────────────────────────────────────────────────────────────────────────
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

  /*
   * The confirmation panel greets the sender by name, and the Server Action's result carries
   * only `{ ok: true }` — so the name is captured on the way out, from the FormData the
   * action is about to receive.
   *
   * "Send another enquiry" is the other half: the action state stays `ok` for good, so
   * something local has to put the form back. What is stored is the dismissed *result
   * object*, not a boolean — `useActionState` hands back a fresh object on every submit, so
   * an identity check reopens the panel after the next send without an effect to reset a
   * flag (which the React compiler rightly rejects as a cascading render).
   */
  const [sender, setSender] = useState('');
  const [dismissedResult, setDismissedResult] = useState<QuoteState | null>(null);

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

  const showSuccess = Boolean(state.ok) && state !== dismissedResult;

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    return () => {
      for (const photo of photosRef.current) URL.revokeObjectURL(photo.previewUrl);
    };
  }, []);

  // On submit failure, move focus to the first invalid field. Without this a phone user is
  // left staring at the submit button with the error scrolled off screen.
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

  // The previews leave the screen when the form is replaced by the confirmation panel, so
  // their object URLs are released there and then. Revoking twice (here and again on
  // unmount) is a no-op.
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
    let failure: string | null =
      picked.length > room ? fill(t('errors.tooManyFiles'), tokens) : null;

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
      {/*
        Both live regions are in the DOM from first render, empty. A region inserted at the
        same moment it gains content is announced unreliably; one that is already there is
        announced every time.
      */}
      <div role="status" aria-live="polite">
        {showSuccess ? (
          <div className={INK_PANEL}>
            <Bricks courses={GLYPH_THREE} height={20} joint={2} className="w-[2.125rem] text-ink" />
            <p className="font-display text-h3 text-fg-strong">{t('success.title')}</p>
            <p className="text-small text-fg-muted">{t('success.body', { name: sender })}</p>
            <button
              type="button"
              onClick={() => {
                setDismissedResult(state);
                setPhotos([]);
                setPhotoError(null);
              }}
              className={UNDERLINE_LINK}
            >
              <span className={UNDERLINE_RULE}>{t('success.again')}</span>
            </button>
          </div>
        ) : null}
      </div>

      <div role="alert">
        {formError ? (
          <p className="border-l-[3px] border-danger bg-danger-soft px-5 py-4 text-small text-fg-strong">
            {formError}
          </p>
        ) : null}
      </div>

      {showSuccess ? null : (
        <form
          // `formData` is built from the form, then the downscaled blobs are appended. The
          // file input itself is deliberately unnamed: if it were named, the browser would
          // also serialise the *originals* and blow the 4 MB Server Action body limit.
          action={(formData) => {
            setSender(String(formData.get('name') ?? '').trim());
            for (const photo of photos) formData.append('photos', photo.blob, photo.filename);
            formAction(formData);
          }}
          className="relative flex flex-col gap-5"
        >
          {/* Two-up from 480px, exactly as the prototype: name and the contact detail are
              both short, and pairing them keeps the form to four visible rows. */}
          <div className="grid grid-cols-1 gap-5 min-[45rem]:grid-cols-2">
            <Field id="quote-name" label={t('name.label')} error={fieldError('name')}>
              <input
                id="quote-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder={t('name.placeholder')}
                required
                aria-required="true"
                aria-invalid={Boolean(fieldError('name')) || undefined}
                aria-describedby={fieldError('name') ? 'quote-name-error' : undefined}
                className={`${FIELD_CONTROL} h-control`}
              />
            </Field>

            <Field id="quote-phone" label={t('phone.label')} error={fieldError('phone')}>
              {/* `type="tel"` plus `inputMode` is what makes a phone show the dialling pad. */}
              <input
                id="quote-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={t('phone.placeholder')}
                required
                aria-required="true"
                aria-invalid={Boolean(fieldError('phone')) || undefined}
                aria-describedby={fieldError('phone') ? 'quote-phone-error' : undefined}
                className={`${FIELD_CONTROL} h-control`}
              />
            </Field>
          </div>

          <Field
            id="quote-email"
            label={t('email.label')}
            hint={t('email.optional')}
            error={fieldError('email')}
          >
            <input
              id="quote-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={t('email.placeholder')}
              aria-invalid={Boolean(fieldError('email')) || undefined}
              aria-describedby={fieldError('email') ? 'quote-email-error' : undefined}
              className={`${FIELD_CONTROL} h-control`}
            />
          </Field>

          <Field id="quote-message" label={t('message.label')}>
            <textarea
              id="quote-message"
              name="message"
              rows={5}
              placeholder={t('message.placeholder')}
              className={`${FIELD_CONTROL} min-h-33 resize-y py-3.5 leading-normal`}
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
                  `${actionClasses('outline')} cursor-pointer ` +
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

          <div className="flex flex-col items-start gap-4">
            <button
              type="submit"
              disabled={isPending}
              className={`${actionClasses('ink')} w-full sm:w-auto`}
            >
              {isPending ? t('submitting') : t('submit')}
            </button>
            <p className="text-small text-fg-muted">{t('privacyNote')}</p>
          </div>
        </form>
      )}
    </div>
  );
}

/** Inlined rather than pulled from an icon library: one shape, `currentColor`, no payload. */
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
