'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { usePointerDrag } from '../hooks/use-pointer-drag';
import { cn } from '../lib/cn';

export type DemoSurfaceMode = 'boxed' | 'plain';

export const DemoSurfaceContext = createContext<{
  resized: boolean;
  reset: () => void;
}>({ resized: false, reset: () => {} });

export function useDemoSurfaceResize() {
  return useContext(DemoSurfaceContext);
}

const DEFAULT_HEIGHT = 500;
const MIN_HEIGHT = 240;
const MIN_WIDTH = 360;

type Size = {
  width: number;
  height: number;
  maxed: boolean;
};

const DEMO_SURFACE_VARS: CSSProperties = {
  ['--example-demo-bg' as string]: '#0e0f12',
  ['--example-demo-fg' as string]: '#d9dde3',
  ['--example-demo-fg-strong' as string]: '#f3f4f7',
  ['--example-demo-muted' as string]: '#9aa1ab',
  ['--example-demo-muted-soft' as string]: '#6f7785',
  ['--example-demo-border' as string]: '#2a2d33',
  ['--example-demo-border-soft' as string]: 'rgba(255, 255, 255, 0.08)',
  ['--example-demo-panel-bg' as string]: '#111318',
  ['--example-demo-panel-bg-raised' as string]: '#1f2127',
  ['--example-demo-control-active-bg' as string]: 'rgba(255, 255, 255, 0.1)',
  ['--example-demo-code-bg' as string]: '#101318',
  ['--example-demo-meta-bg' as string]: 'rgba(255, 255, 255, 0.07)',
  ['--tilery-bg' as string]: '#0e0f12',
  ['--tilery-fg' as string]: '#d9dde3',
  ['--tilery-panel-bg' as string]: '#1a1c20',
  ['--tilery-panel-border' as string]: '#2a2d33',
  ['--tilery-tabbar-bg' as string]: '#16181c',
  ['--tilery-tab-fg' as string]: '#9aa1ab',
  ['--tilery-tab-active-bg' as string]: '#1a1c20',
  ['--tilery-tab-active-fg' as string]: '#f3f4f7',
  ['--tilery-tab-hover-bg' as string]: 'rgba(255, 255, 255, 0.04)',
  ['--tilery-menu-bg' as string]: '#1f2228',
  ['--tilery-action-hover-bg' as string]: 'rgba(255, 255, 255, 0.08)',
  ['--tilery-accent' as string]: 'var(--site-workspace-accent)',
  ['--tilery-drop-bg' as string]:
    'color-mix(in srgb, var(--site-workspace-accent), transparent 82%)',
  ['--tilery-drop-border' as string]:
    'color-mix(in srgb, var(--site-workspace-accent), transparent 28%)',
  ['--tilery-resize-handle-active-bg' as string]:
    'color-mix(in srgb, var(--site-workspace-accent), transparent 38%)',
  ['--home-demo-accent' as string]: 'var(--site-workspace-accent)',
  ['--home-demo-drop-bg' as string]: 'var(--tilery-drop-bg)',
  ['--home-demo-drop-border' as string]: 'var(--tilery-drop-border)',
};

export function DemoSurface({
  surface,
  children,
  height: defaultHeight = DEFAULT_HEIGHT,
}: {
  surface: DemoSurfaceMode;
  children: ReactNode;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size | null>(null);

  const reset = useCallback(() => setSize(null), []);
  const resized = size !== null;

  const context = useMemo(() => ({ resized, reset }), [resized, reset]);

  useEffect(() => {
    if (!size) return;
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const newWidth = entries[0]?.contentRect.width;
      if (!newWidth) return;
      setSize((prev) => {
        if (!prev) return null;
        if (prev.width > newWidth) {
          return { ...prev, width: newWidth, maxed: false };
        }
        if (prev.maxed && prev.width < newWidth) {
          return { ...prev, width: newWidth, maxed: true };
        }
        return prev;
      });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [size]);

  const directionRef = useRef<'bottom' | 'right' | 'corner'>('bottom');

  const { startDrag } = usePointerDrag({
    onMove: (e) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const parentWidth =
        container.parentElement?.getBoundingClientRect().width ?? rect.width;
      const next: Partial<Size> = {};
      const direction = directionRef.current;
      if (direction === 'right' || direction === 'corner') {
        const clampedWidth = Math.max(
          MIN_WIDTH,
          Math.min(parentWidth, e.clientX - rect.left),
        );
        next.width = clampedWidth;
        next.maxed = clampedWidth >= parentWidth - 1;
      }
      if (direction === 'bottom' || direction === 'corner') {
        next.height = Math.max(MIN_HEIGHT, e.clientY - rect.top);
      }
      setSize((prev) => {
        const base = prev ?? {
          width: parentWidth,
          height: container.getBoundingClientRect().height,
          maxed: true,
        };
        return { ...base, ...next };
      });
    },
  });

  const startResize = useCallback(
    (
      event: PointerEvent<HTMLElement>,
      direction: 'bottom' | 'right' | 'corner',
    ) => {
      event.preventDefault();
      directionRef.current = direction;
      startDrag(event.currentTarget, event.pointerId);
    },
    [startDrag],
  );

  return (
    <DemoSurfaceContext.Provider value={context}>
      <div
        className="relative mb-6"
        style={
          size
            ? { ['--demo-frame-width' as string]: `${size.width}px` }
            : undefined
        }>
        <div
          className={cn(
            'demo-surface relative min-h-60 min-w-96 overflow-hidden text-base text-[var(--example-demo-fg)] scheme-dark [&_.tilery]:text-base [&_.tilery__tab-content]:text-[color:var(--example-demo-fg)] [&_.tilery__tab-content_:is(p,li,dd,dt)]:text-[color:var(--example-demo-fg)] [&_.tilery__tab-content_code]:bg-[var(--example-demo-code-bg)] [&_.tilery__tab-content_code]:text-[color:var(--example-demo-fg-strong)]',
            surface === 'boxed' &&
              'border border-[var(--example-demo-border)] rounded-md bg-[var(--example-demo-bg)]',
          )}
          ref={containerRef}
          style={{
            ...DEMO_SURFACE_VARS,
            height: size ? size.height : defaultHeight,
          }}>
          {children}
        </div>
        <span
          className="absolute z-6 touch-none -bottom-1 left-0 right-0 h-2 cursor-ns-resize"
          onPointerDown={(e) => startResize(e, 'bottom')}
          aria-hidden="true"
        />
        <span
          className="absolute z-6 touch-none -right-1 top-0 bottom-0 w-2 cursor-ew-resize"
          onPointerDown={(e) => startResize(e, 'right')}
          aria-hidden="true"
        />
        <span
          className="absolute z-6 touch-none right-[calc(100%-var(--demo-frame-width,100%)-7px)] -bottom-2 size-6 cursor-nwse-resize"
          onPointerDown={(e) => startResize(e, 'corner')}
          aria-hidden="true"
        />
      </div>
    </DemoSurfaceContext.Provider>
  );
}
