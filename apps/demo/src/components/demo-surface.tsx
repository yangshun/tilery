'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { usePointerDrag } from '../hooks/use-pointer-drag';
import { cn } from '../lib/cn';
import demoStyles from './demo-surface.module.css';

/** Whether a demo renders inside a bordered box or flush (full-bleed). */
export type DemoSurfaceMode = 'boxed' | 'plain';

/** Context exposed by DemoSurface so children (e.g. ExampleSection) can
 *  show a Reset button when the frame has been manually resized. */
export const DemoSurfaceContext = createContext<{
  resized: boolean;
  reset: () => void;
}>({ resized: false, reset: () => {} });

/** Hook to consume the nearest DemoSurface resize state. */
export function useDemoSurfaceResize() {
  return useContext(DemoSurfaceContext);
}

const DEFAULT_HEIGHT = 500;
const MIN_HEIGHT = 240;
const MIN_WIDTH = 360;

type Size = {
  width: number;
  height: number;
  /** Whether the last drag hit the container width limit. */
  maxed: boolean;
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
        className={demoStyles.demoSurfaceWrap}
        style={
          size
            ? { ['--demo-frame-width' as string]: `${size.width}px` }
            : undefined
        }>
        <div
          className={cn(
            demoStyles.demoSurface,
            surface === 'boxed' && demoStyles['demoSurface--boxed'],
          )}
          ref={containerRef}
          style={size ? { height: size.height } : { height: defaultHeight }}>
          {children}
        </div>
        <span
          className={cn(
            demoStyles.demoSurface__resize,
            demoStyles['demoSurface__resize--bottom'],
          )}
          onPointerDown={(e) => startResize(e, 'bottom')}
          aria-hidden="true"
        />
        <span
          className={cn(
            demoStyles.demoSurface__resize,
            demoStyles['demoSurface__resize--right'],
          )}
          onPointerDown={(e) => startResize(e, 'right')}
          aria-hidden="true"
        />
        <span
          className={cn(
            demoStyles.demoSurface__resize,
            demoStyles['demoSurface__resize--corner'],
          )}
          onPointerDown={(e) => startResize(e, 'corner')}
          aria-hidden="true"
        />
      </div>
    </DemoSurfaceContext.Provider>
  );
}
