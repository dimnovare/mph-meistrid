import type { ReactNode } from 'react';

/**
 * Horizontal frame. `gutter` is a fluid clamp (20px at 360px → 64px at 1280px) so the page
 * never has the cramped 16px edge that makes a site feel like a template.
 */
type ContainerProps = {
  children: ReactNode;
  /** `page` is the default content measure; `wide` is for photo grids; `copy` for prose. */
  width?: 'page' | 'wide' | 'copy' | 'form';
  className?: string;
};

const widths = {
  page: 'max-w-page',
  wide: 'max-w-wide',
  copy: 'max-w-copy',
  form: 'max-w-form',
} as const;

export function Container({ children, width = 'page', className = '' }: ContainerProps) {
  return (
    <div className={`mx-auto w-full px-gutter ${widths[width]} ${className}`.trim()}>
      {children}
    </div>
  );
}

/**
 * A page section with the vertical rhythm and an anchor target.
 *
 * `id` is what the header navigation scroll-links to; `scroll-padding-top` in globals.css
 * keeps the heading clear of the sticky header.
 */
type SectionProps = {
  children: ReactNode;
  id?: string;
  /** Ink sections invert the palette via the `on-ink` variant defined in globals.css. */
  tone?: 'page' | 'surface' | 'ink';
  size?: 'default' | 'sm';
  /** Set when the section's own heading is not the accessible name. */
  labelledBy?: string;
  className?: string;
};

const tones = {
  page: 'bg-page text-fg',
  surface: 'bg-surface text-fg',
  ink: 'on-ink bg-ink text-on-ink',
} as const;

export function Section({
  children,
  id,
  tone = 'page',
  size = 'default',
  labelledBy,
  className = '',
}: SectionProps) {
  const padding = size === 'sm' ? 'py-section-sm' : 'py-section';

  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      // `scroll-mt-0` is deliberate: the offset comes from `scroll-padding-top` on <html>,
      // which also covers keyboard focus navigation, not just anchor clicks.
      className={`${tones[tone]} ${padding} ${className}`.trim()}
    >
      {children}
    </section>
  );
}
