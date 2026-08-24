import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

/**
 * The site's only button.
 *
 * Renders as `<button>`, `<a>` or a `<Link>` depending on `as`, because a "Helista" control
 * is a link to a `tel:` URL and a "Salvesta" control is a form submit — and getting that
 * wrong breaks both screen readers and long-press-to-copy on a phone.
 *
 * Focus is not styled here. `:focus-visible` in globals.css draws one ink ring that clears
 * 3:1 against every surface including the orange fill, and inverts inside `.on-ink`.
 */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'default' | 'lg' | 'admin' | 'adminHero';

const base =
  'inline-flex items-center justify-center gap-2.5 rounded-control font-display font-bold ' +
  'text-center whitespace-nowrap transition-colors select-none ' +
  'disabled:pointer-events-none disabled:opacity-50';

const variants: Record<Variant, string> = {
  // Black label on orange, never white: white on #E2600F is 3.55:1 and fails AA. It is also
  // the native colour pairing of real site signage.
  primary:
    'bg-accent text-on-accent shadow-edge hover:bg-accent-hover active:bg-accent-press ' +
    'on-ink:bg-accent on-ink:text-on-accent',

  // `line-strong` rather than `line`: this border is the control's only visible boundary, so
  // it has to clear 3:1 on its own (WCAG 1.4.11).
  secondary:
    'border border-line-strong bg-page text-fg-strong hover:bg-surface-2 active:bg-surface-2 ' +
    'on-ink:border-ink-line on-ink:bg-transparent on-ink:text-on-ink on-ink:hover:bg-ink-raised',

  ghost:
    'text-fg-strong hover:bg-surface-2 active:bg-surface-2 ' +
    'on-ink:text-on-ink on-ink:hover:bg-ink-raised',

  danger: 'bg-danger text-white hover:opacity-90 active:opacity-80',
};

const sizes: Record<Size, string> = {
  // 48px — comfortably above the 44px touch-target floor.
  default: 'h-control px-6 text-body',
  lg: 'h-14 px-8 text-lead',
  // The admin is used one-handed on a building site, so its controls are deliberately
  // larger than the public site's.
  admin: 'h-control-lg w-full px-6 text-lead sm:w-auto',
  // The two dashboard actions. Full width, tall enough to hit without looking.
  adminHero: 'h-control-xl w-full px-6 text-h3',
};

type OwnProps = {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
};

type ButtonProps = OwnProps & { as?: 'button' } & ComponentPropsWithoutRef<'button'>;
type AnchorProps = OwnProps & { as: 'a' } & ComponentPropsWithoutRef<'a'>;

export function Button(props: ButtonProps): ReactNode;
export function Button(props: AnchorProps): ReactNode;
export function Button({
  variant = 'primary',
  size = 'default',
  className = '',
  children,
  as,
  ...rest
}: OwnProps & { as?: ElementType } & Record<string, unknown>) {
  const Tag = (as ?? 'button') as ElementType;
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`.trim();

  // A <button> outside a form defaults to type="submit", which silently submits any form it
  // happens to be inside. Default it to "button" and let callers opt into submitting.
  const typeProp = Tag === 'button' && rest.type === undefined ? { type: 'button' as const } : {};

  return (
    <Tag className={classes} {...typeProp} {...rest}>
      {children}
    </Tag>
  );
}
