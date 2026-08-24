# Brand assets

Drop the delivered MPH Meistrid identity files here:

```
logo-horizontal.svg         dark version, for light backgrounds (header)
logo-horizontal-light.svg   light version, for the ink bands (footer, hero)
mark.svg                    the compact MPH mark, square
icon.svg                    square, for the favicon and social avatar
```

Then follow the swap instructions at the top of `src/components/brand/Logo.tsx`. That file is
the only place in the codebase that knows what the logo looks like.

Two constraints the identity work must honour so nothing shifts when the real files land
(see `docs/design-system.md` §8): the horizontal lockup is **5:1** and the compact mark is
**1:1**. The SVGs need a `viewBox`, no fixed `width`/`height`, and `fill="currentColor"` so a
single file serves both the light and dark contexts.
