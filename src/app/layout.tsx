import type { ReactNode } from 'react';

/**
 * Every public route lives under `app/[locale]` and every admin route under `app/admin`,
 * and each of those layouts renders its own `<html>` with the right `lang`. Next still
 * requires a root layout to exist, so this one only passes through.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
