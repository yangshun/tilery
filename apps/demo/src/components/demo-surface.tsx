import type { ReactNode } from 'react';

/** Whether a demo renders inside a bordered box or flush (full-bleed). */
export type DemoSurfaceMode = 'boxed' | 'plain';

/**
 * Frames a live example demo. `boxed` adds the bordered surface; `plain`
 * renders the demo flush (used by theme / full-bleed examples).
 */
export function DemoSurface({
  surface,
  children,
}: {
  surface: DemoSurfaceMode;
  children: ReactNode;
}) {
  return (
    <div
      className={
        surface === 'boxed'
          ? 'example-preview__demo-surface example-preview__demo-surface--boxed'
          : 'example-preview__demo-surface'
      }>
      {children}
    </div>
  );
}
