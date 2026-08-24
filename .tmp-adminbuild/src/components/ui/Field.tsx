import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Form field primitives, shared by the public quote form and the admin.
 *
 * Two things here are not stylistic preference:
 *
 * - The label is a real `<label htmlFor>`, never a placeholder. A placeholder disappears the
 *   moment someone types, which on a phone means they can no longer see what the field was.
 * - Font size never drops below 16px on an input. Below that, iOS Safari zooms the whole
 *   page on focus and does not zoom back out, which is the single most common way a mobile
 *   form feels broken.
 */

const controlBase =
  'w-full rounded-control border bg-page px-4 text-body text-fg-strong ' +
  'placeholder:text-fg-muted transition-colors ' +
  'disabled:bg-surface-2 disabled:text-fg-muted';

// `line-strong` is the resting border: as the field's only visible boundary it must clear
// 3:1 on its own (WCAG 1.4.11). `line` would not.
const controlIdle = 'border-line-strong hover:border-fg-muted';
const controlInvalid = 'border-danger';

type FieldProps = {
  id: string;
  label: string;
  children: ReactNode;
  /** Rendered next to the label, e.g. "valikuline". */
  hint?: string;
  /** Rendered below, wired to the control via aria-describedby by the caller. */
  error?: string;
  required?: boolean;
  className?: string;
};

export function Field({ id, label, children, hint, error, required, className = '' }: FieldProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`.trim()}>
      <label htmlFor={id} className="flex items-baseline gap-2 text-label uppercase text-fg">
        <span>{label}</span>
        {required ? (
          <span className="text-accent-strong" aria-hidden="true">
            *
          </span>
        ) : null}
        {hint ? <span className="normal-case tracking-normal text-fg-muted">{hint}</span> : null}
      </label>

      {children}

      {error ? (
        <p id={`${id}-error`} className="text-small text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = ComponentPropsWithoutRef<'input'> & { invalid?: boolean };

export function Input({ invalid, className = '', ...rest }: InputProps) {
  return (
    <input
      {...rest}
      aria-invalid={invalid || undefined}
      className={`${controlBase} h-control ${invalid ? controlInvalid : controlIdle} ${className}`.trim()}
    />
  );
}

type TextareaProps = ComponentPropsWithoutRef<'textarea'> & { invalid?: boolean };

export function Textarea({ invalid, rows = 4, className = '', ...rest }: TextareaProps) {
  return (
    <textarea
      {...rest}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={`${controlBase} resize-y py-3 leading-normal ${
        invalid ? controlInvalid : controlIdle
      } ${className}`.trim()}
    />
  );
}

/**
 * The admin's bilingual pair: an Estonian field with a Russian one beside it.
 *
 * Estonian is the required one and comes first. Russian is explicitly optional, and the hint
 * says what happens if it is left empty — otherwise the administrator has no way to know that
 * blank means "show the Estonian text" rather than "show nothing".
 */
type BilingualProps = {
  id: string;
  name: string;
  label: string;
  ruLabel: string;
  ruHint: string;
  defaultEt?: string;
  defaultRu?: string;
  required?: boolean;
  multiline?: boolean;
  error?: string;
};

export function BilingualField({
  id,
  name,
  label,
  ruLabel,
  ruHint,
  defaultEt = '',
  defaultRu = '',
  required,
  multiline,
  error,
}: BilingualProps) {
  const Control = multiline ? Textarea : Input;

  return (
    <div className="flex flex-col gap-4">
      <Field id={`${id}-et`} label={label} required={required} error={error}>
        <Control
          id={`${id}-et`}
          name={`${name}_et`}
          defaultValue={defaultEt}
          required={required}
          invalid={Boolean(error)}
          aria-describedby={error ? `${id}-et-error` : undefined}
        />
      </Field>

      <Field id={`${id}-ru`} label={ruLabel} hint={ruHint}>
        <Control id={`${id}-ru`} name={`${name}_ru`} defaultValue={defaultRu} />
      </Field>
    </div>
  );
}
