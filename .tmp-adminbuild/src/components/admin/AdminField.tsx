/**
 * The admin's form fields.
 *
 * Separate from `src/components/ui/Field.tsx` rather than layered on top of it. That file is
 * shared with the public quote form, where 48px controls, 13px uppercase eyebrow labels and
 * 1px borders are correct; the admin needs 56px, 16px sentence-case labels and 2px borders,
 * and — the part no descendant-selector override could express — two *different* border
 * weights, because the Estonian box and the Russian box are not equally important and the
 * design says so with the border rather than with a word.
 *
 * The names, ids and `defaultValue`s are byte-identical to what the shared component
 * produced, so `saveProjectAction` reads exactly the same form.
 *
 * Two things here are not stylistic:
 *
 * - The label is a real `<label htmlFor>`, never a placeholder. A placeholder disappears the
 *   moment someone types, which on a phone means he can no longer see what the field was.
 * - Input text is 18px. Below 16px iOS Safari zooms the page on focus and does not zoom back
 *   out, which is the single most common way a mobile form feels broken.
 *
 * There is no bespoke focus ring: `globals.css` draws one 3px `fg-strong` outline for the
 * whole site, which clears 3:1 against every surface here. The board sketches a 3px `line`
 * halo instead — that is 1.3:1 on white and could not be the indicator, so the audited ring
 * stays and the border simply darkens underneath it.
 */

import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { adminFieldError, adminHint, adminLabel } from '@/components/admin/styles';

const controlBase =
  'w-full rounded-panel border-2 bg-page px-4 text-[1.125rem] text-fg-strong ' +
  'placeholder:text-fg-muted transition-colors ' +
  'disabled:bg-surface-2 disabled:text-fg-muted';

/** The field he is meant to fill in. */
const controlPrimary = 'border-fg hover:border-fg-strong focus:border-fg-strong';

/**
 * The Russian box, and anything else the site works without. `line-strong` is the quietest
 * border that still clears 3:1 as a control's only boundary (WCAG 1.4.11) — quieter than
 * that and it would stop being a legal edge, not just a subtle one.
 */
const controlQuiet = 'border-line-strong hover:border-fg-muted focus:border-fg';

const controlInvalid = 'border-danger';

type FieldProps = {
  id: string;
  label: string;
  children: ReactNode;
  /**
   * The part of the label that is not the field's name — „— vene keeles“, „— ei ole
   * kohustuslik“. Set in regular weight on `fg-muted` so the eye takes the name first.
   */
  suffix?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
};

export function AdminField({
  id,
  label,
  children,
  suffix,
  hint,
  error,
  required,
  className = '',
}: FieldProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`.trim()}>
      {/*
        Inline flow rather than flex, so the spaces between the name, the asterisk and the
        suffix are real characters. Under `display:flex` they are gaps, which look right but
        leave the accessible name reading „Märkus— ei ole kohustuslik“ — the label is the
        input's accessible name, so it has to be a sentence when it is spoken as well as
        when it is read.
      */}
      <label htmlFor={id} className={`${adminLabel} block`}>
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true">
            {' *'}
          </span>
        ) : null}
        {suffix ? <span className="font-normal text-fg-muted">{` ${suffix}`}</span> : null}
      </label>

      {children}

      {hint ? <p className={adminHint}>{hint}</p> : null}

      {error ? (
        <p id={`${id}-error`} className={adminFieldError} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type Tone = 'primary' | 'quiet';

type InputProps = ComponentPropsWithoutRef<'input'> & { invalid?: boolean; tone?: Tone };

export function AdminInput({ invalid, tone = 'primary', className = '', ...rest }: InputProps) {
  const border = invalid ? controlInvalid : tone === 'quiet' ? controlQuiet : controlPrimary;

  return (
    <input
      {...rest}
      aria-invalid={invalid || undefined}
      className={`${controlBase} h-14 ${border} ${className}`.trim()}
    />
  );
}

type TextareaProps = ComponentPropsWithoutRef<'textarea'> & { invalid?: boolean; tone?: Tone };

export function AdminTextarea({
  invalid,
  tone = 'primary',
  rows = 4,
  className = '',
  ...rest
}: TextareaProps) {
  const border = invalid ? controlInvalid : tone === 'quiet' ? controlQuiet : controlPrimary;

  return (
    <textarea
      {...rest}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={`${controlBase} min-h-28 resize-y py-3.5 leading-[1.5] ${border} ${className}`.trim()}
    />
  );
}

type BilingualProps = {
  id: string;
  name: string;
  /** The field's name — „Töö nimi“. Both boxes carry it; the suffix tells them apart. */
  label: string;
  /** Usually absent: the Estonian box is the field, and the Russian one is the variant. */
  etSuffix?: string;
  ruSuffix: string;
  /** Said once for the pair, under both boxes. */
  hint: string;
  defaultEt?: string;
  defaultRu?: string;
  required?: boolean;
  multiline?: boolean;
  error?: string;
};

/**
 * The Estonian box with the Russian one beside it.
 *
 * Estonian is the required one and comes first. Russian is explicitly optional — quieter
 * border, „ei ole kohustuslik“ on the label — and the hint under the pair says what happens
 * if it is left empty, because otherwise there is no way to know that blank means "show the
 * Estonian text" rather than "show nothing".
 *
 * From 640px the two sit side by side and share one hint (board 1q). Below that they stack,
 * because at 360px two boxes on a line would be 150px each.
 */
export function AdminBilingualField({
  id,
  name,
  label,
  etSuffix,
  ruSuffix,
  hint,
  defaultEt = '',
  defaultRu = '',
  required,
  multiline,
  error,
}: BilingualProps) {
  const Control = multiline ? AdminTextarea : AdminInput;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4">
        <AdminField
          id={`${id}-et`}
          label={label}
          suffix={etSuffix}
          required={required}
          error={error}
        >
          <Control
            id={`${id}-et`}
            name={`${name}_et`}
            defaultValue={defaultEt}
            required={required}
            invalid={Boolean(error)}
            aria-describedby={error ? `${id}-et-error` : undefined}
          />
        </AdminField>

        <AdminField id={`${id}-ru`} label={label} suffix={ruSuffix}>
          <Control id={`${id}-ru`} name={`${name}_ru`} defaultValue={defaultRu} tone="quiet" />
        </AdminField>
      </div>

      <p className={adminHint}>{hint}</p>
    </div>
  );
}
