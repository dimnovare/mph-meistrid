import Image from 'next/image';

import { publicUrl } from '@/lib/r2';
import type { ProjectImage as StoredImage } from '@/lib/types';

/**
 * The one place that knows how a stored photo becomes an `<Image>`.
 *
 * A photo's `src` is `<publicBase>/media/projects/<projectId>/<imageId>` — deliberately with
 * **no width and no extension**. `src/lib/image-loader.ts` appends `-{width}.webp` after
 * snapping the requested width to a variant that actually exists in R2. Building that URL
 * anywhere else would mean two places to fix when the ladder changes.
 *
 * This imports `@/lib/r2`, which is `server-only`. That is on purpose: if a client component
 * ever tries to render a project photo the build fails loudly instead of shipping the R2
 * config to the browser.
 */

type Props = {
  projectId: string;
  image: StoredImage;
  /** Never decorative — a project photo is the content. */
  alt: string;
  /**
   * Required, not optional. Without it the browser assumes 100vw and downloads a 2000px
   * variant for a 290px card, which is the single most common cause of a bad Lighthouse
   * score on a photo grid. The value depends on the *layout*, so the caller owns it.
   */
  sizes: string;
  /** `fill` needs a parent with `position: relative` and a resolved height (an aspect box). */
  fill?: boolean;
  /**
   * Next 16 deprecated `priority` in favour of `preload`. Exactly one image per page may
   * set it — the LCP element. Everything else stays lazy.
   */
  preload?: boolean;
  className?: string;
};

export function ProjectImage({
  projectId,
  image,
  alt,
  sizes,
  fill = false,
  preload = false,
  className = '',
}: Props) {
  const src = publicUrl(`media/projects/${projectId}/${image.id}`);

  // `placeholder="blur"` throws for a remote image with no `blurDataURL`. An older record
  // written before the blur pipeline existed would have an empty string, so guard rather
  // than crash a page that is otherwise fine.
  const blur =
    image.blurDataURL && image.blurDataURL.startsWith('data:')
      ? ({ placeholder: 'blur', blurDataURL: image.blurDataURL } as const)
      : {};

  // `fetchPriority` rides along with `preload` so the browser also *orders* the request
  // ahead of the rest of the page, not just discovers it early.
  const loadingProps = preload
    ? ({ preload: true, fetchPriority: 'high' } as const)
    : ({ loading: 'lazy' } as const);

  // No `quality` prop: the custom loader ignores it (the WebP ladder is already encoded at
  // q78-82), and in Next 16 a quality outside `images.qualities` is silently coerced, which
  // would only produce a confusing dev warning for no effect.
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={`object-cover ${className}`.trim()}
        {...blur}
        {...loadingProps}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      // Intrinsic size of the largest variant. These reserve the box and stop CLS; they do
      // not decide the rendered size — CSS does.
      width={image.width}
      height={image.height}
      sizes={sizes}
      className={className}
      {...blur}
      {...loadingProps}
    />
  );
}
